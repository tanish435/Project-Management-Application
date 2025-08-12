import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;
    const { slug } = await context.params;

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {       
        if(slug.length !== 6) {
            const errResponse = new ApiResponse(400, null, "Invalid board slug");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const validUser = await BoardModel.findOne({
            $or: [{admin: user._id}, {members: user._id}]
        })

        if(!validUser) {
            const errResponse = new ApiResponse(401, null, "Not authorised to view board")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        const board = await BoardModel.aggregate([
            {
                $match: {
                    url: slug,
                    // $or: [{ admin: user._id }, { members: user._id }]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "admin",
                    foreignField: "_id",
                    as: "admin",
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
                    from: "lists",
                    localField: "lists",
                    foreignField: "_id",
                    as: "lists",
                    pipeline: [
                        {
                            $sort: {position: 1}
                        },
                        {
                            $lookup: {
                                from: "boards",
                                localField: "board",
                                foreignField: "_id",
                                as: "boardInfo",
                                pipeline: [
                                    {
                                        $project: {
                                            _id: 1,
                                            name: 1,
                                            url: 1,
                                            bgColor: 1,
                                            admin: 1,
                                            members: 1,
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
                                            intials: 1,
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
                                as: "cards",
                                pipeline: [
                                    {
                                        $sort: {position: 1}
                                    },
                                    {
                                        $lookup: {
                                            from: "comments",
                                            localField: "comments",
                                            foreignField: "_id",
                                            as: "comments"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "checklists",
                                            localField: "checklists",
                                            foreignField: "_id",
                                            as: "checklists"
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "attachments",
                                            localField: "attachments",
                                            foreignField: "_id",
                                            as: "attachments"
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
                                                    $project:{
                                                        _id: 1,
                                                        username: 1,
                                                        fullName: 1,
                                                        avatar: 1,
                                                        initials: 1,
                                                        email: 1,
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        $lookup: {
                                            from: "lists",
                                            localField: "lists",
                                            foreignField: "_id",
                                            as: "lists",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        _id: 1,
                                                        name: 1,
                                                        board: 1,
                                                        createdBy: 1
                                                    }
                                                }
                                            ]
                                        }
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
                                                        email: 1,
                                                        username: 1,
                                                        fullName: 1,
                                                        avatar: 1,
                                                        initials: 1
                                                    }
                                                }
                                            ]
                                        }
                                    },
                                    {
                                        $project: {
                                            _id: 1,
                                            description: 1,
                                            name: 1,
                                            position: 1,
                                            list: 1,
                                            slug: 1,
                                            dueDate: 1,
                                            members: 1,
                                            comments: { $cond: { if: { $isArray: "$comments" }, then: { $size: "$comments" }, else: 0 } },
                                            checklists: { $cond: { if: { $isArray: "$checklists" }, then: { $size: "$checklists" }, else: 0 } },
                                            attachments: { $cond: { if: { $isArray: "$attachments" }, then: { $size: "$attachments" }, else: 0 } },
                                        }
                                    }
                                ]
                            }
                        }, 
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                slug: 1,
                                position: 1,
                                board: 1,
                                createdBy: 1,
                                cards: 1,
                                createdAt: 1,
                                updatedAt: 1,
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    url: 1,
                    bgColor: 1,
                    admin: 1,
                    members: 1,
                    lists: 1,
                    createdAt: 1,
                    updatedAt: 1,
                }
            }
        ]); 

        if (!board.length) {
            const errResponse = new ApiResponse(404, null, "Board not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, board[0], "Board fetched successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error fetching board", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}