import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CardModel from "@/models/Card.model";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, { params }: { params: { cardId: string, listId: string } }) {
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

    const { cardId, listId } = params
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { position } = await req.json()
        const pos = Number(position)
        if (isNaN(pos) || pos < 0) {
            const errResponse = new ApiResponse(400, null, "Invalid position index");
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
            const card = await CardModel.findById(cardId).session(session)
            if (!card) {
                await session.abortTransaction()
                await session.endSession()

                const errResponse = new ApiResponse(404, null, "Card not found");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const isSameList = card.list.toString() === listId

            if (isSameList) {
                const sameListCards = await CardModel.find({ list: card.list }).sort("position").session(session) as any

                if (pos >= sameListCards.length) {
                    await session.abortTransaction()
                    await session.endSession()

                    const errResponse = new ApiResponse(400, null, `Position should be less than ${sameListCards.length}`);
                    return new Response(JSON.stringify(errResponse), {
                        status: errResponse.statusCode,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                const fromIndex = card.position
                const toIndex = pos

                sameListCards.splice(fromIndex, 1)
                sameListCards.splice(toIndex, 0, card)

                for (let i = 0; i < sameListCards.length; i++) {
                    sameListCards[i].position = i
                    await sameListCards[i].save({ session })
                }
            } else {
                const oldListCards = await CardModel.find({ list: card.list }).sort("position").session(session) as any
                for (let i = 0; i < oldListCards.length; i++) {
                    if (oldListCards[i]._id.equals(card._id)) {
                        oldListCards.splice(i, 1);
                        break;
                    }
                }

                for (let i = 0; i < oldListCards.length; i++) {
                    oldListCards[i].position = i;
                    await oldListCards[i].save({ session })
                }

                // Insert into new list (Reorder and insert)
                const newListCards = await CardModel.find({ list: listId }).sort("position").session(session) as any
                if (pos > newListCards.length) {
                    await session.abortTransaction()
                    await session.endSession()

                    const errResponse = new ApiResponse(400, null, `Position should be less than or equal to ${newListCards.length}`);
                    return new Response(JSON.stringify(errResponse), {
                        status: errResponse.statusCode,
                        headers: { "Content-Type": "application/json" },
                    });
                }

                await ListModel.findByIdAndUpdate(
                    listId,
                    {
                        $addToSet: {cards: cardId}
                    },
                    {new: true, session}
                )

                await ListModel.findByIdAndUpdate(
                    card.list,
                    {
                        $pull: {cards: cardId}
                    },
                    {new: true, session}
                )

                newListCards.splice(pos, 0, card)
                for (let i = 0; i < newListCards.length; i++) {
                    newListCards[i].position = i
                    if (newListCards[i]._id.equals(card._id)) {
                        newListCards[i].list = new mongoose.Types.ObjectId(listId)

                    }

                    await newListCards[i].save({ session })
                }
            }


            await session.commitTransaction()
            await session.endSession()

            const response = new ApiResponse(200, card, "Card position updated successfully")
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        } catch (error) {
            await session.abortTransaction()
            await session.endSession()

            const errResponse = new ApiResponse(404, null, "Failed to update card position");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
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