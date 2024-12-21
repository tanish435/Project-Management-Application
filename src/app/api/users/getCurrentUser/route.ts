import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";

export async function GET(req: Request) {
    await dbConnect()

    try {
        const {searchParams} = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId || !isValidObjectId(userId)) {
            throw new ApiError(400, 'Invalid user ID')
        }
        
        const validUserId = new mongoose.Types.ObjectId(userId)

        const user = await UserModel.find(validUserId).select({
            username: 1,
            fullName: 1,
            initials: 1,
            email: 1,
            avatar: 1
        })

        if (!user) {
            const errResponse = new ApiResponse(404, null, "User not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(200, user, "User retrieved successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error getting current user", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })

    }
}