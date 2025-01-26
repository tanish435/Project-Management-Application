import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function DELETE(req: Request, {params}: {params: {boardId: string}}) {
    await dbConnect()
    const {boardId} = params
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
        const deletedBoard = await BoardModel.findOneAndDelete({
            $and: [{_id: boardId}, {admin: user._id}]
        });

        if (!deletedBoard) {
            const errResponse = new ApiResponse(403, null, "You are not authorized to delete this board or it does not exist");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const updateUser = await UserModel.findOneAndUpdate(
            { _id: user._id },
            { $pull: { boards: boardId } },
            { new: true }
        );

        if(!updateUser) {
            const errResponse = new ApiResponse(500, null, "Failed to delete board from user")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(200, deletedBoard, "Board deleted successfully")
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error deleting board: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}