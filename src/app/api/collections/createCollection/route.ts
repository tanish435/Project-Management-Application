import dbConnect from "@/lib/dbConnect";
import CollectionModel from "@/models/Collection.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { isValidObjectId } from "mongoose";
import { User, getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import UserModel from "@/models/User.model";

export async function POST(req: Request) {
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

    // Check if the user exists
    // Collection name should be present 
    // At least one board must be present

    try {
        const { name, boardIds } = await req.json()
        console.log(boardIds);

        if (!name || !boardIds || !Array.isArray(boardIds) || boardIds.length === 0) {
            throw new ApiError(400, 'Collection name and a valid board ID must be present')
        }

        const invalidBoardIds = boardIds.filter((id: string) => !isValidObjectId(id))
        if (invalidBoardIds.length > 0) {
            const errResponse = new ApiResponse(401, null, `Invalid board id: ${invalidBoardIds.join(", ")}`)
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if (!user) {
            throw new ApiError(404, 'User not found');
        }

        const collection = await CollectionModel.create({
            name,
            boards: boardIds,
            owner: user._id
        })

        if (!collection) {
            throw new ApiError(501, 'Failed to create collection');
        }

        const updateUser = await UserModel.findByIdAndUpdate(
            user._id,
            {
                $addToSet: { collections: collection._id }
            },
            { new: true }
        )

        if (!updateUser) {
            const errResponse = new ApiResponse(501, null, "Failed to update user collection attribute")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, collection, "Collection created successfully")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error creating collection: ", error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}