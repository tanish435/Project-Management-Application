import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CardModel from "@/models/Card.model";
import ChecklistModel from "@/models/Checklist.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function DELETE(req: Request, { params }: { params: { cardId: string, id: string } }) {
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

    const { id, cardId } = params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid card ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
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
            const errResponse = new ApiResponse(403, null, "You are not authorised to view this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const deleteChecklist = await ChecklistModel.findOneAndDelete({
                _id: id,
                card: cardId
            }).session(session)

            if (!deleteChecklist) {
                await session.abortTransaction()
                session.endSession()

                const errResponse = new ApiResponse(404, null, "Failed to delete checklist");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const updateCard = await CardModel.findByIdAndUpdate(
                cardId,
                {
                    $pull: {checklists: id}
                },
                {new: true, session}
            )

            if(!updateCard) {
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

            const successResponse = new ApiResponse(200, deleteChecklist, "Checklist deleted successfully")
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        } catch (error) {
            await session.abortTransaction()
            session.endSession()

            const errResponse = new ApiResponse(500, null, "Failed to delete checklist");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error deleting checklist: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}