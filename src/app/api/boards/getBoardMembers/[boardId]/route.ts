import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request, {params}: {params: {boardId: string}}) { 
    await dbConnect();
    const {boardId} = params
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const board = await BoardModel.findById(boardId)

        if(!board) {
            const errResponse = new ApiResponse(404, null, "Board not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if(!board.members.includes(new mongoose.Types.ObjectId(user._id))) {
            const errResponse = new ApiResponse(403, null, "Forbidden")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const getMembers = await BoardModel.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(boardId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "members",
                    foreignField: "_id",
                    as: "members",
                    pipeline: [
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                avatar: 1,
                                fullName: 1,
                                initials: 1,
                                email: 1,
                                isVerified: 1
                            }
                        }
                    ]
                }
            }, 
            {
                $project: {
                    members: 1
                }
            }
        ])

        const members = getMembers[0]?.members || []

        const successResponse = new ApiResponse(200, {members}, "Members retrieved successfully")
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        const errResponse = new ApiResponse(500, null, "Internal server error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })        
    }
}