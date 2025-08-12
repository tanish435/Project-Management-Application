import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, context: { params: Promise<{ boardId: string }> }) {
    await dbConnect()
    const { boardId } = await context.params
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User;

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    if (!boardId || !mongoose.isValidObjectId(boardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid board ID")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const { name } = await req.json()

        if (!name || typeof name !== "string" || name.trim() === "") {
            const errResponse = new ApiResponse(400, null, "Invalid board name");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const board = await BoardModel.findById(boardId)
        if (board && board.admin._id.toString() !== user._id) {
            const errResponse = new ApiResponse(400, null, "Unauthorised")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const boardName = await BoardModel.findByIdAndUpdate(
            boardId,
            { name },
            { new: true }
        )

        if (!boardName) {
            const errResponse = new ApiResponse(400, null, "Failed to update board name")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(200, boardName, "Board name updated successfully")
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error changing board name: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}