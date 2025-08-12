import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/utils/ApiResponse";
import BoardModel from "@/models/Board.model";
import mongoose from "mongoose";
import ListModel from "@/models/List.model";

export async function POST(req: Request) {
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

    try {
        const { name, position, boardId } = await req.json()
        const pos = Number(position)

        if (!mongoose.Types.ObjectId.isValid(boardId)) {
            const errResponse = new ApiResponse(400, null, "Invalid board ID format");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const board = await BoardModel.findById(boardId)
        if (!board || !board.members.includes(new mongoose.Types.ObjectId(user._id))) {
            const errResponse = new ApiResponse(404, null, "Board not found or you are not authorised to create list");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            const errResponse = new ApiResponse(400, null, "Invalid or empty name");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (isNaN(pos) || pos < 0) {
            const errResponse = new ApiResponse(400, null, "List position is required");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const lastList = await ListModel.findOne({board: boardId})
                .sort({position: -1})
                .session(session);

            const expectedPosition = lastList ? lastList.position + 1 : 0  
            
            if(expectedPosition !== pos) {
                await session.abortTransaction()
                await session.endSession()

                const errResponse = new ApiResponse(400, null, `Invalid position. The next position should be ${expectedPosition}`);
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }
            
            const [list] = await ListModel.create([{
                name,
                position: pos,
                board: boardId,
                createdBy: user._id,
                cards: [],
            }], { session })

            board.lists.push(list._id as mongoose.Types.ObjectId)
            await board.save({ session })

            await session.commitTransaction()
            session.endSession()

            const successResponse = new ApiResponse(200, list, "List created successfully");
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Error in create list transaction:", error);
            await session.abortTransaction();
            session.endSession()

            const errResponse = new ApiResponse(500, null, "Error creating list");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error creating list", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}