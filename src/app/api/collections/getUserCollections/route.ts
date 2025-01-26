import dbConnect from "@/lib/dbConnect";
import { ApiResponse } from "@/utils/ApiResponse";
import { User, getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "@/utils/ApiError";
import CollectionModel from "@/models/Collection.model";

export async function GET(req: Request) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(400, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10))

    try {
        const collections = await CollectionModel.aggregate([
            {
                $match: { owner: new mongoose.Types.ObjectId(user._id) }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails",
                    pipeline: [
                        {
                            $project: {
                                avatar: 1,
                                username: 1,
                                email: 1,
                                initials: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "boards",
                    localField: "boards",
                    foreignField: "_id",
                    as: "boardDetails",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "admin",
                                foreignField: "_id",
                                as: "adminDetails",
                                pipeline: [
                                    {
                                        $project: {
                                            avatar: 1,
                                            username: 1,
                                            email: 1,
                                            initials: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $project: {
                                name: 1,
                                bgColor: 1,
                                url: 1,
                                admin: 1,
                                members: 1,
                                adminDetails: {$arrayElemAt: ["$adminDetails", 0]}
                            }
                        }
                    ]
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        ])

        if (!collections || collections.length == 0) {
            const errResponse = new ApiResponse(400, [], "Failed to fetch user collections")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(200, collections, "User collection fetched successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Error fetching collections:", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}