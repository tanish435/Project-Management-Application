import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if(!session || !session.user) {
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

        const userBoards = await BoardModel.aggregate([
            {
                $match: {$or: [{admin: validUserId}, {members: validUserId}]}
            },
            {
                $lookup: {
                    from: "users",
                    localField: "admin",
                    foreignField: "_id",
                    as: "admin"
                },
            },
            {
                $unwind: "$admin"
            },
            {
                $lookup: {
                    from: "users",
                    localField: "members",
                    foreignField: "_id",
                    as: "members"
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    bgColor: 1,
                    url: 1,
                    admin: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        avatar: 1
                    },
                    members: {
                        _id: 1,
                        username: 1,
                        email: 1,
                        avatar: 1
                    },
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $sort: {updatedAt: -1}
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        ])

        if(userBoards.length === 0) {
            const response = new ApiResponse(200, {boards: []}, "No boards found")
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, {boards: userBoards}, "User boards fetched successfully")
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