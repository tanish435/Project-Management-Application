import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/options";
import { ApiResponse } from "@/utils/ApiResponse";
import ListModel from "@/models/List.model";
import mongoose from "mongoose";
import BoardModel from "@/models/Board.model";

export async function GET(req: Request, { params }: { params: { listId: string, boardId: string } }) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { listId, boardId } = params

    if (!mongoose.Types.ObjectId.isValid(listId)) {
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid board ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const board = await BoardModel.findById(boardId)
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!board.members.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
            const errResponse = new ApiResponse(403, null, "You are not authorised to access list");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const cards = await ListModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(listId) }
            },
            {
                $lookup: {
                    from: "cards",
                    localField: "cards",
                    foreignField: "_id",
                    as: "cardInfo",
                    pipeline: [
                        {
                            $sort: { position: 1 }
                        },
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "members",
                                as: "members",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            avatar: 1,
                                            initials: 1,
                                            fullName: 1,
                                            email: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                foreignField: "_id",
                                localField: "createdBy",
                                as: "createdBy",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            avatar: 1,
                                            initials: 1,
                                            fullName: 1,
                                            email: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                createdBy: 1,
                                members: 1,
                                comments: { $size: "$comments" },
                                position: 1,
                                dueDate: 1,
                                attachments: { $size: "$attachments" },
                                checklists: { $size: "$checklists" },
                                list: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    name: 1,
                    cardInfo: 1,
                    createdBy: 1,
                    position: 1,
                    board: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ])

        if (!cards) {
            const errResponse = new ApiResponse(400, null, "Card details not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, cards, "Card details fetched successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error fetching cards", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}