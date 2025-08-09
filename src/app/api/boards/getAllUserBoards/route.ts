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

        // First, get the user's boards from their profile
        const userProfile = await UserModel.findById(validUserId).select('boards');
        const userBoardIds = userProfile?.boards || [];

        // Create a comprehensive match condition
        const matchCondition = {
            $or: [
                { admin: validUserId },           // User is admin
                { members: validUserId },         // User is in members array
                { _id: { $in: userBoardIds } }    // Board ID is in user's boards array
            ]
        };

        console.log("User ID:", validUserId);
        console.log("User's board IDs:", userBoardIds);
        console.log("Match condition:", JSON.stringify(matchCondition, null, 2));

        const userBoards = await BoardModel.aggregate([
            {
                $match: matchCondition
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

        console.log("Found boards:", userBoards.length);

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
        const errResponse = new ApiResponse(500, null, "Error fetching user boards")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}