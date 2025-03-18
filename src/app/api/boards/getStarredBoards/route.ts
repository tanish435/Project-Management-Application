import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const validUserId = new mongoose.Types.ObjectId(user._id);
        const url = new URL(req.url);
        const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
        const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10));

        const userBoards = await UserModel.aggregate([
            {
                $match: { _id: validUserId }
            },
            {
                $lookup: {
                    from: "boards",
                    localField: "starredBoards",
                    foreignField: "_id",
                    as: "starredBoards",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                name: 1,
                                bgColor: 1,
                                url: 1,
                                createdAt: 1,
                                updatedAt: 1
                            }
                        }
                    ]
                },
            },
            {
                $sort: { updatedAt: -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        ])

        if (!userBoards.length || !userBoards[0].starredBoards.length) {
            const response = new ApiResponse(200, { starredBoards: [] }, "No starred boards found")
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, { boards: userBoards[0].starredBoards }, "User starred boards fetched successfully")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.log("Error fetching user boards", error)
        const errResponse = new ApiResponse(500, null, "Error fethcing user boards")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}