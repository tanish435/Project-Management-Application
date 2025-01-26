import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CollectionModel from "@/models/Collection.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function PATCH(req: Request, { params }: { params: { collectionId: string; boardId: string } }) {
    await dbConnect()
    
    const { collectionId, boardId } = params
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User;

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    if (!collectionId || !mongoose.isValidObjectId(collectionId)) {
        const errResponse = new ApiResponse(400, null, "Invalid collection ID")
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
        const updatedCollection = await CollectionModel.findOneAndUpdate(
            { _id: collectionId, owner: user._id, boards: boardId },
            { $pull: { boards: boardId } },
            { new: true }
        );

        if (!updatedCollection) {
            return new Response(JSON.stringify(new ApiResponse(404, null, "Collection not found or you are not authorized")), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(new ApiResponse(200, updatedCollection, "Board removed from collection successfully")), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        const errResponse = new ApiResponse(500, null, "Internal server error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}