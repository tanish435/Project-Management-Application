import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";
import { authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";

export async function PATCH(req: Request) {
    await dbConnect()
    const session = await getServerSession(authOptions)

    if(!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const { username, fullName, userId } = await req.json()
        const validUserId = new mongoose.Types.ObjectId(userId)

        if(!username && !fullName) {
            const errResponse = new ApiResponse(400, null, "Username or fullname is required")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (!isValidObjectId(validUserId)) {
            throw new ApiError(400, 'Invalid user ID')
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            validUserId,
            {
                $set: {
                    username,
                    fullName
                }
            },
            {new: true, fields: "username fullName email"}
        )

        if (!updatedUser) {
            const errResponse = new ApiResponse(400, null, "Failed to update user")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, updatedUser, "User Profile updated successfully")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Failed to update user profile", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
