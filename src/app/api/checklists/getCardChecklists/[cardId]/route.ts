import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CardModel from "@/models/Card.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request, {params}: {params: {cardId: string}}) {
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

    const { cardId } = params

    try {
        const validUsers = await CardModel.aggregate([
            {
                $match: { $or: [{_id: new mongoose.Types.ObjectId(cardId)}, {slug: cardId}] }
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

        if (!validUsers.length) {
            const errResponse = new ApiResponse(404, null, "Card not found");
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

        const checklists = await CardModel.aggregate([
            {
                $match: {$or: [{_id: new mongoose.Types.ObjectId(cardId)}, {slug: cardId}]}
            },
            {
                $lookup: {
                    from: "checklists",
                    localField: "checklists",
                    foreignField: "_id",
                    as: "checklists",
                    pipeline: [
                        {
                            $lookup: {
                                from: "todos",
                                localField: "todos",
                                foreignField: "_id",
                                as: "todos",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "users",
                                            localField: "createdBy",
                                            foreignField: "_id",
                                            as: "createdBy",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        _id: 1,
                                                        username: 1,
                                                        fullName: 1,
                                                        email: 1,
                                                        avatar: 1,
                                                        initials: 1,
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "users",
                                            localField: "assignedTo",
                                            foreignField: "_id",
                                            as: "assignedTo",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        _id: 1,
                                                        username: 1,
                                                        fullName: 1,
                                                        email: 1,
                                                        avatar: 1,
                                                        initials: 1,
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            content: 1,
                                            complete: 1,
                                            pos: 1,
                                            createdBy: 1,
                                            assignedTo: 1,
                                            createdAt: 1,
                                            updatedAt: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "createdBy",
                                foreignField: "_id",
                                as: "createdBy",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            username: 1,
                                            fullName: 1,
                                            email: 1,
                                            avatar: 1,
                                            initials: 1,
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                createdBy: 1,
                                card: 1,
                                todos: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    checklists: 1,
                }
            }
        ])

        const successResponse = new ApiResponse(
            200,
            checklists.length ? checklists : [],
            checklists.length ? "Card checklists fetched successfully" : "Card has no checklists"
        );
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error fetching card checklists", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}