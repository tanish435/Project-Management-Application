import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(
    req: Request,
    { params }: { params: { boardId: string } }
) {
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
        const { boardId } = params;
        
        // Validate boardId
        if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
            const errResponse = new ApiResponse(400, null, "Invalid board ID")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const validUserId = new mongoose.Types.ObjectId(user._id);
        const validBoardId = new mongoose.Types.ObjectId(boardId);

        // Check if board exists
        const board = await BoardModel.findById(validBoardId);
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Check if user has access to this board (is a member)
        if (!board.members.includes(validUserId)) {
            const errResponse = new ApiResponse(403, null, "Access denied. You are not a member of this board")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // Find the user and check if board is already starred
        const userData = await UserModel.findById(validUserId);
        if (!userData) {
            const errResponse = new ApiResponse(404, null, "User not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const isBoardStarred = userData.starredBoards.includes(validBoardId);
        let updatedUser;
        let message: string;

        if (isBoardStarred) {
            // Remove from starred boards
            updatedUser = await UserModel.findByIdAndUpdate(
                validUserId,
                { $pull: { starredBoards: validBoardId } },
                { new: true }
            );
            message = "Board removed from starred boards";
        } else {
            // Add to starred boards
            updatedUser = await UserModel.findByIdAndUpdate(
                validUserId,
                { $addToSet: { starredBoards: validBoardId } },
                { new: true }
            );
            message = "Board added to starred boards";
        }

        if (!updatedUser) {
            const errResponse = new ApiResponse(500, null, "Failed to update starred status")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(
            200, 
            { 
                isStarred: !isBoardStarred,
                boardId: boardId,
                starredBoardsCount: updatedUser.starredBoards.length
            }, 
            message
        )
        
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.log("Error toggling board starred status", error)
        const errResponse = new ApiResponse(500, null, "Error toggling board starred status")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}