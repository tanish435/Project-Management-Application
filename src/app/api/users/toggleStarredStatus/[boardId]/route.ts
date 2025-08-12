import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, context: { params: Promise<{ boardId: string }> }) {
    await dbConnect();
    const { boardId } = await context.params;
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!boardId || !mongoose.isValidObjectId(boardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid board ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const board = await BoardModel.findById(boardId);
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const userDoc = await UserModel.findById(user._id);
        if (!userDoc) {
            const errResponse = new ApiResponse(404, null, "User not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const validBoardId = new mongoose.Types.ObjectId(boardId);
        const isUserAuthorized = userDoc.boards.includes(validBoardId); 

        if (!isUserAuthorized) {
            const errResponse = new ApiResponse(403, null, "You are not authorized to access this board");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const isStarred = userDoc.starredBoards.includes(validBoardId);
        const updatedUser = await UserModel.findByIdAndUpdate(
            user._id,
            {
                [isStarred ? "$pull" : "$addToSet"]: { starredBoards: boardId },
            },
            { new: true }
        );

        if (!updatedUser) {
            const errResponse = new ApiResponse(500, null, "Error toggling board starred status");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const response = new ApiResponse(
            200,
            updatedUser.starredBoards,
            isStarred ? "Board removed from starred" : "Board added to starred"
        );
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.log("Error toggling board starred status", error);
        const errResponse = new ApiResponse(500, null, "Error toggling board starred status");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
