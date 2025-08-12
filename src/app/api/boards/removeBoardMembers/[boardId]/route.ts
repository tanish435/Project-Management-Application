import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, context: { params: Promise<{ boardId: string }> }) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    const { boardId } = await context.params



    try {
        const { userId } = await req.json()
        const board = await BoardModel.findById(boardId)
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (!userId) {
            const errResponse = new ApiResponse(400, null, "User id is required");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(boardId)) {
            const errResponse = new ApiResponse(400, null, "Invalid board or user ID");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if(board.admin.toString() === userId) {
            const errResponse = new ApiResponse(400, null, "Cannot remove board admin from board");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        if (board.admin.toString() !== user._id) {
            const errResponse = new ApiResponse(401, null, "Not authorized to remove member from board");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const doesUserExistInBoard = board.members.includes(userId)
        if (!doesUserExistInBoard) {
            const response = new ApiResponse(200, null, "User already not present in board")
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const removeUser = await BoardModel.findByIdAndUpdate(
            boardId,
            {
                $pull: { members: userId }
            },
            { new: true }
        )

        if (!removeUser) {
            const errResponse = new ApiResponse(400, null, 'Failed to remove user from boards')
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            {
                $pull: { boards: boardId }
            },
            { new: true }
        )

        if (!updatedUser) {
            const errResponse = new ApiResponse(400, null, 'Failed to remove board from users')
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const response = new ApiResponse(200, { boardId, userId }, 'Board member removed successfully')
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.log("Error removing board members: ", error);
        const errResponse = new ApiResponse(500, null, "Internal server error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}   