import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { Liveblocks } from "@liveblocks/node";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

const liveblocks = new Liveblocks({
    secret: process.env.LIVEBLOCKS_SECRET_KEY as string,
})

// Updated API endpoint with better error handling
export async function DELETE(req: Request, { params }: { params: { boardId: string, slug: string } }) {
    await dbConnect()
    const { boardId, slug } = params
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
        const board = await BoardModel.findById(boardId)
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if(!board.admin.equals(user._id)) {
            const errResponse = new ApiResponse(403, null, "You are not authorized to delete this board");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Delete Liveblocks room first (using slug as room ID)
        try {
            await liveblocks.deleteRoom(slug)
            console.log(`Liveblocks room ${slug} deleted successfully`)
        } catch (liveblocksError) {
            console.error("Error deleting Liveblocks room:", liveblocksError)
            // Continue with board deletion even if Liveblocks fails
        }

        // Start MongoDB transaction for board deletion
        const mongoSession = await mongoose.startSession()
        mongoSession.startTransaction()

        try {
            // Delete the board (this will trigger the pre-hook for cascade deletion)
            const deletedBoard = await BoardModel.findByIdAndDelete(boardId, { session: mongoSession });

            // Update users to remove board references
            await UserModel.updateMany(
                {$or: [{boards: boardId}, {starredBoards: boardId}]},
                {$pull: {boards: boardId, starredBoards: boardId}},
                {session: mongoSession}
            )

            await mongoSession.commitTransaction()
            mongoSession.endSession()

            const successResponse = new ApiResponse(200, deletedBoard, "Board and associated room deleted successfully")
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })

        } catch (dbError) {
            await mongoSession.abortTransaction()
            mongoSession.endSession()
            console.error("Database deletion error:", dbError)
            throw dbError
        }

    } catch (error: any) {
        console.error("Error deleting board: ", error);
        const errResponse = new ApiResponse(500, null, `Internal Server Error: ${error.message}`)
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}