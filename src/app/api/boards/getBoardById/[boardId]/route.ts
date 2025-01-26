import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request, { params }: { params: { boardId: string } }) {
    await dbConnect();
    const { boardId } = params;
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    if (!boardId || !mongoose.isValidObjectId(boardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid board ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const validUser = await BoardModel.findOne({
            $or: [{admin: user._id}, {members: user._id}]
        })

        if(!validUser) {
            const errResponse = new ApiResponse(401, null, "Not authorised to view board")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        const board = await BoardModel.findOne({
            _id: boardId,
            $or: [{ admin: user._id }, { members: user._id }],
        });

        if(!board) {
            const errResponse = new ApiResponse(403, null, "Not authorised");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
        
        const boardById = await BoardModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(boardId)},
            },
            {
                $lookup: {
                    from: "users",
                    localField: "admin",
                    foreignField: "_id",
                    as: "admin",
                },
            },
            {
                $unwind: "$admin",
            },
            {
                $lookup: {
                    from: "users",
                    localField: "members",
                    foreignField: "_id",
                    as: "members",
                },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    bgColor: 1,
                    url: 1,
                    admin: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                    members: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        image: 1,
                    },
                    createdAt: 1,
                    updatedAt: 1,
                },
            },
        ]);

        if (!board || boardById.length === 0) {
            const errResponse = new ApiResponse(404, null, "Board not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const response = new ApiResponse(200, boardById[0], "Board fetched successfully");
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error fetching board by ID", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}
