import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CollectionModel from "@/models/Collection.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { User, getServerSession } from "next-auth";

export async function PATCH(req: Request, { params }: { params: { collectionId: string } }) {
    await dbConnect()
    const collectionId = params.collectionId;
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

    try {
        const { name } = await req.json()
        const collection = await CollectionModel.findById(collectionId)

        if (!name || typeof (name) !== "string" || name.trim() === "") {
            const errResponse = new ApiResponse(400, null, "Collection name is required")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (!collection) {
            const errResponse = new ApiResponse(404, null, "Collection not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (collection.owner.toString() !== user._id) {
            const errResponse = new ApiResponse(403, null, "Not authorized")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const updatedCollection = await CollectionModel.findByIdAndUpdate(
            collectionId,
            {
                $set: { name }
            },
            { new: true }
        )

        if (!updatedCollection) {
            const errResponse = new ApiResponse(400, null, "Failed to update collection")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, updatedCollection, "Collection name updated successfully")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error updating collection: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}