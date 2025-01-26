import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/utils/ApiResponse";
import generateUniqueUrlId from "@/utils/generateUrlId";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";

export async function POST(req: Request) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if(!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const {name, bgColor} = await req.json()
        const url = await generateUniqueUrlId()

        if(!name) {
            const errResponse = new ApiResponse(400, null, "Board name is required")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const board = await BoardModel.create({
            name,
            bgColor,
            url,
            admin: user._id,
            members: [user._id],
            lists: []
        })

        const addBoardToUser = await UserModel.updateOne({_id: user._id}, {
            $addToSet: {boards: board._id}
        })

        if(!addBoardToUser) {
            const errResponse = new ApiResponse(500, null, "Failed to add board to user")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if(!board) {
            const errResponse = new ApiResponse(500, null, "Failed to create board")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(201, board, "Board created successfully")
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