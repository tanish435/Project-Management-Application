import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CardModel from "@/models/Card.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
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

    const { slug } = params
    if (!slug || slug.length !== 6) {
        const errResponse = new ApiResponse(400, null, "Invalid card slug");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const validUsers = await CardModel.aggregate([
            {
                $match: { slug }
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

        const authorisedUsers = validUsers[0]?.listInfo[0]?.board[0]?.members || []
        if (!authorisedUsers.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
            const errResponse = new ApiResponse(400, null, "You are not authorised to view this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const card = await CardModel.aggregate([
            {
                $match: { slug }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "members",
                    foreignField: "_id",
                    as: "members",
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
                    from: "attachments",
                    localField: "attachments",
                    foreignField: "_id",
                    as: "attachments",
                    pipeline: [
                        {
                            $lookup: {
                                from: "attachmentLists",
                                localField: "attachmentList",
                                foreignField: "_id",
                                as: "attachmentLists",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "users",
                                            localField: "attachedBy",
                                            foreignField: "_id",
                                            as: "attachedBy",
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
                                            url: 1,
                                            isWebsiteLink: 1,
                                            attachedBy: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                attachmentLists: 1
                            }
                        }
                    ]
                }
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
                                            createdBy: 1
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
                                todos: 1
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
                $lookup: {
                    from: "comments",
                    localField: "comments",
                    foreignField: "_id",
                    as: "comments",
                    pipeline: [
                        {
                            $lookup: {
                                from: "cards",
                                localField: "card",
                                foreignField: "_id",
                                as: "card",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            name: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",
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
                                owner: 1,
                                card: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "lists",
                    localField: "list",
                    foreignField: "_id",
                    as: "list",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                board: 1
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    position: 1,
                    dueDate: 1,
                    slug: 1,
                    members: 1,
                    attachments: 1,
                    checklists: 1,
                    createdBy: 1,
                    comments: 1,
                    list: 1
                }
            }
        ])

        if (!card || card.length === 0) {
            const errResponse = new ApiResponse(404, null, "Card details not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, card[0], "Card fetched by slug successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error fetching card by slug", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}