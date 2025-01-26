import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CollectionModel from "@/models/Collection.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose, { isValidObjectId } from "mongoose";
import { User, getServerSession } from "next-auth";

export async function GET(req: Request, { params }: { params: { collectionId: string } }) {
    await dbConnect()
    const collectionId = params.collectionId
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    if (!collectionId || !isValidObjectId(collectionId)) {
        const errResponse = new ApiResponse(400, null, "Invalid collection ID")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    const validCollectionId = new mongoose.Types.ObjectId(collectionId)
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10))

    try {
        const collection = await CollectionModel.aggregate([
            {
                $match: { _id: validCollectionId }
            },
            {
                $lookup: {
                    from: "boards",
                    localField: "boards",
                    foreignField: "_id",
                    as: "boardDetails",
                    pipeline: [
                        {
                            $project: {
                                name: 1,
                                url: 1,
                                bgColor: 1,
                                admin: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $unwind: {path: "$ownerDetails", preserveNullAndEmptyArrays: true}
            },
            {
                $project: {
                    name: 1,
                    createdAt: 1,
                    boardDetails: 1,
                    "ownerDetails.username": 1,
                    "ownerDetails._id": 1,
                    "ownerDetails.avatar": 1,
                    "ownerDetails.email": 1,
                    "ownerDetails.initials": 1,
                }
            },
            {
                $skip: (page - 1) * limit
            }, 
            {
                $limit: limit
            }
        ])

        if (!collection || collection.length === 0) {
            const errResponse = new ApiResponse(404, null, "Failed to fetch collection detail")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, collection[0], "Collection details fetched successfully")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error fetching collection detials: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}