import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CardModel from "@/models/Card.model";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, context: { params: Promise<{ cardId: string, listId: string }> }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { cardId, listId } = await context.params;
    
    if (!mongoose.Types.ObjectId.isValid(cardId) || !mongoose.Types.ObjectId.isValid(listId)) {
        const errResponse = new ApiResponse(400, null, "Invalid ID(s)");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { position } = await req.json();
        const newPos = Number(position);
        
        if (isNaN(newPos) || newPos < 0) {
            const errResponse = new ApiResponse(400, null, "Invalid position index");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check authorization first
        const validUsers = await CardModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(cardId) } },
            {
                $lookup: {
                    from: "lists",
                    localField: "list",
                    foreignField: "_id",
                    as: "listInfo",
                    pipeline: [
                        {
                            $lookup: {
                                from: "boards",
                                localField: "board",
                                foreignField: "_id",
                                as: "board",
                                pipeline: [{ $project: { members: 1 } }]
                            }
                        }
                    ]
                }
            }
        ]);

        if (!validUsers.length || !validUsers[0]?.listInfo?.length) {
            const errResponse = new ApiResponse(404, null, "Card or associated data not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const authorisedUsers = validUsers[0]?.listInfo[0]?.board[0]?.members || [];
        if (!authorisedUsers.some((memberId: mongoose.Types.ObjectId) => 
            memberId.toString() === user._id.toString())) {
            const errResponse = new ApiResponse(403, null, "You are not authorized to move this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Start a session for the transaction
        const dbSession = await mongoose.startSession();
        
        try {
            // Use withTransaction to ensure proper cleanup if transaction fails
            await dbSession.withTransaction(async () => {
                // Get the card we want to move
                const card = await CardModel.findById(cardId).session(dbSession);
                
                if (!card) {
                    throw new Error("Card not found");
                }

                const isSameList = card.list.toString() === listId;
                const currentPos = card.position;
                
                if (isSameList) {
                    // Count total cards in the list to check bounds
                    const totalCards = await CardModel.countDocuments({ list: card.list }).session(dbSession);
                    
                    if (newPos >= totalCards) {
                        throw new Error(`Position should be less than ${totalCards}`);
                    }
                    
                    // Skip if already in correct position
                    if (currentPos === newPos) {
                        return;
                    }
                    
                    // Update positions of affected cards
                    if (currentPos < newPos) {
                        // Moving forward: decrease position of cards between old and new position
                        await CardModel.updateMany(
                            {
                                list: card.list,
                                position: { $gt: currentPos, $lte: newPos }
                            },
                            { $inc: { position: -1 } },
                            { session: dbSession }
                        );
                    } else {
                        // Moving backward: increase position of cards between new and old position
                        await CardModel.updateMany(
                            {
                                list: card.list,
                                position: { $gte: newPos, $lt: currentPos }
                            },
                            { $inc: { position: 1 } },
                            { session: dbSession }
                        );
                    }
                    
                    // Update the card's position
                    await CardModel.updateOne(
                        { _id: cardId },
                        { $set: { position: newPos } },
                        { session: dbSession }
                    );
                    
                } else {
                    // Moving between lists - more complex case
                    
                    // 1. Get count of cards in target list
                    const targetListCardCount = await CardModel.countDocuments({ list: listId }).session(dbSession);
                    
                    if (newPos > targetListCardCount) {
                        throw new Error(`Position should be less than or equal to ${targetListCardCount}`);
                    }
                    
                    // 2. Update positions in source list (decrease position of cards after the moved card)
                    await CardModel.updateMany(
                        {
                            list: card.list,
                            position: { $gt: currentPos }
                        },
                        { $inc: { position: -1 } },
                        { session: dbSession }
                    );
                    
                    // 3. Update positions in target list (increase position to make room)
                    await CardModel.updateMany(
                        {
                            list: listId,
                            position: { $gte: newPos }
                        },
                        { $inc: { position: 1 } },
                        { session: dbSession }
                    );
                    
                    // 4. Update the list references
                    await ListModel.findByIdAndUpdate(
                        listId,
                        { $addToSet: { cards: cardId } },
                        { session: dbSession }
                    );
                    
                    await ListModel.findByIdAndUpdate(
                        card.list,
                        { $pull: { cards: cardId } },
                        { session: dbSession }
                    );
                    
                    // 5. Update the card with new list and position
                    await CardModel.updateOne(
                        { _id: cardId },
                        { 
                            $set: { 
                                list: new mongoose.Types.ObjectId(listId),
                                position: newPos 
                            }
                        },
                        { session: dbSession }
                    );
                }
            });
            
            // Get updated card to return in response
            const updatedCard = await CardModel.findById(cardId);
            const response = new ApiResponse(200, updatedCard, "Card position updated successfully");
            
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' }
            });
            
        } catch (error) {
            console.error("Error in update card position transaction:", error);
            
            if (error instanceof Error) {
                const errResponse = new ApiResponse(400, null, error.message);
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }
            
            const errResponse = new ApiResponse(500, null, "Failed to update card position");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } finally {
            // Always end the session
            await dbSession.endSession();
        }
    } catch (error) {
        console.log("Error updating card position", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}