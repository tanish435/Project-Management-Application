import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function DELETE(req: Request, { params }: { params: { listId: string, boardId: string } }) {
    await dbConnect()
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { listId, boardId } = params
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid board ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const board = await BoardModel.findById(boardId)
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const list = await ListModel.findById(listId)
        if (!list) {
            const errResponse = new ApiResponse(404, null, "List not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const isAdmin = board.admin.equals(user._id)
        const isListCreator = list.createdBy.equals(user._id)
        if (!isAdmin && !isListCreator) {
            const errResponse = new ApiResponse(403, null, "You are not authorized to delete this list");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const dbSession = await mongoose.startSession()
        dbSession.startTransaction()

        try {
            const deletedList = await ListModel.findByIdAndDelete(listId).session(dbSession)
            if (!deletedList) {
                await dbSession.abortTransaction();
                dbSession.endSession();
                const errResponse = new ApiResponse(400, null, "Failed to delete list");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            await ListModel.updateMany(
                { board: boardId, position: { $gt: deletedList.position } },
                { $inc: { position: -1 } }, 
                { session: dbSession }
            );

            await dbSession.commitTransaction();
            dbSession.endSession();

            const successResponse = new ApiResponse(200, deletedList, "List deleted and positions updated successfully");
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            await dbSession.abortTransaction();
            dbSession.endSession();

            console.log("Error deleting list: ", error);
            const errResponse = new ApiResponse(500, null, "Error deleting list");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error deleting list: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}