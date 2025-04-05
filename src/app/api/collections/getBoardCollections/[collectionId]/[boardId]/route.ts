import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CollectionModel from "@/models/Collection.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { User, getServerSession } from "next-auth";

export async function GET(req: Request, { params }: { params: { collectionId: string; boardId: string } }) {
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
        const userInfo = await UserModel.findById(user._id);
        if (!userInfo?.boards.some((id: mongoose.Types.ObjectId) => id.equals(boardId))) {
            const errResponse = new ApiResponse(400, null, "Unauthorized to access the mentioned board")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }
        
        const collection = await CollectionModel.findById(collectionId)
        if (!collection) {
            const errResponse = new ApiResponse(404, null, "Collection not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }
        
        if(collection.owner.toString() !== user._id) {
            const errResponse = new ApiResponse(403, null, "You are not authorized to add board to the mentioned collection")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (collection.boards.some((id: mongoose.Types.ObjectId) => id.equals(boardId))) {
            const errResponse = new ApiResponse(202, null, "Board already present in collection")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const updateCollection = await CollectionModel.findByIdAndUpdate(
            collectionId,
            {
                $addToSet: { boards: boardId }
            },
            { new: true }
        )

        if (!updateCollection) {
            const errResponse = new ApiResponse(404, null, "Collection not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(200, updateCollection, "Board added to collection successfully")
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error adding board to collection: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
} 