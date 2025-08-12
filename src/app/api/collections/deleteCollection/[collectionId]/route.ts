import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CollectionModel from "@/models/Collection.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { User, getServerSession } from "next-auth";

export async function DELETE(req: Request, context: { params: Promise<{ collectionId: string }> }) {
    await dbConnect()
    const {collectionId} = await context.params
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    if (!collectionId || !mongoose.isValidObjectId(collectionId)) {
        const errResponse = new ApiResponse(400, null, "Invalid collection ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const collection = await CollectionModel.findById(collectionId);
        if (!collection) {
            const errResponse = new ApiResponse(404, null, "Collection not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (collection.owner.toString() !== user._id) {
            const errResponse = new ApiResponse(403, null, "Forbidden: You do not own this collection");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const deleteCollection = await CollectionModel.findByIdAndDelete(collectionId)

        if (!deleteCollection) {
            const errResponse = new ApiResponse(400, null, "Failed to delete collection")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const errResponse = new ApiResponse(200, deleteCollection, "Collection deleted successfully")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error deleting collection: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}