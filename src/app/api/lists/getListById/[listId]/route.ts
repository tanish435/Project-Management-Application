import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

export async function GET(req: Request, { params }: { params: { listId: string } }) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { listId } = params;
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const list = await ListModel.aggregate([
            {
                $match: {_id: new mongoose.Types.ObjectId(listId)}
            },
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "listCreatedBy",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                avatar: 1,
                                fullName: 1,
                                email: 1,
                            }
                        }
                    ]
                }
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
                    _id: 1,
                    name: 1,
                    cardInfo: 1,
                    listCreatedBy: 1,
                    board: 1,
                    position: 1,
                }
            }
        ])

        if (!list || list.length === 0) {
            const errResponse = new ApiResponse(404, null, "List details not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, list, "List details fetched successfully");
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