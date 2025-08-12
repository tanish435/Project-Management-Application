import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/utils/ApiResponse";
import ChecklistModel from "@/models/Checklist.model";
import mongoose from "mongoose";
import CardModel from "@/models/Card.model";

export async function POST(req: Request, context: { params: Promise<{ cardId: string }> }) {
    await dbConnect()
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { cardId } = await context.params
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid card ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { name } = await req.json()
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            const errResponse = new ApiResponse(400, null, "Invalid or empty name");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const validUsers = await CardModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(cardId) }
            },
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
                                pipeline: [
                                    {
                                        $project: {
                                            members: 1,
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ])

        if (!validUsers.length || !validUsers[0]?.listInfo.length) {
            const errResponse = new ApiResponse(404, null, "Card or associated data not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const authorisedUsers = validUsers[0]?.listInfo[0]?.board[0]?.members || []
        if (!authorisedUsers.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
            const errResponse = new ApiResponse(400, null, "You are not authorised to view this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const [checklist] = await ChecklistModel.create([{
                name,
                createdBy: user._id,
                todos: [],
                card: cardId
            }], { session })

            if (!checklist) {
                await session.abortTransaction()
                session.endSession()

                const errResponse = new ApiResponse(400, null, "Checklist not created");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const updateCard = await CardModel.findByIdAndUpdate(
                cardId,
                {
                    $addToSet: { checklists: checklist._id }
                },
                { new: true, session }
            )

            if (!updateCard) {
                await session.abortTransaction()
                session.endSession()

                const errResponse = new ApiResponse(400, null, "Failed to update card");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            await session.commitTransaction()
            session.endSession()

            const successResponse = new ApiResponse(200, checklist, "Checklist created successfully");
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Error in create checklist transaction:", error);
            await session.abortTransaction()
            session.endSession()

            const errResponse = new ApiResponse(500, null, "Failed to create checklist");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error creating checklist", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}