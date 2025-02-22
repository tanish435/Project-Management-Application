import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import CardModel from "@/models/Card.model";
import generateUniqueUrlId from "@/utils/generateUrlId";
import ListModel from "@/models/List.model";
import BoardModel from "@/models/Board.model";

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
        const { name, position, listId } = await req.json()
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            const errResponse = new ApiResponse(400, null, "Invalid or empty name");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const pos = Number(position)
        if (isNaN(pos) || pos < 0) {
            const errResponse = new ApiResponse(400, null, "Invalid position index");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (!mongoose.Types.ObjectId.isValid(listId)) {
            const errResponse = new ApiResponse(400, null, "Invalid list ID");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const list = await ListModel.findById(listId)
            if (!list) {
                await session.abortTransaction()
                await session.endSession()

                const errResponse = new ApiResponse(404, null, "List not found");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const board = await BoardModel.findById(list.board)
            if (!board || !board.members.includes(new mongoose.Types.ObjectId(user._id))) {
                await session.abortTransaction()
                await session.endSession()

                const errResponse = new ApiResponse(404, null, "Board not found or you are not authorised to create card");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const lastCard = await CardModel.findOne({ list: listId })
                .sort({ position: -1 })
                .session(session)

            const expectedPosition = lastCard ? lastCard.position + 1 : 0;

            if (pos !== expectedPosition) {
                await session.abortTransaction()
                await session.endSession()

                const errResponse = new ApiResponse(400, null, `Invalid position. The next position should be ${expectedPosition}`);
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            const slug = await generateUniqueUrlId()

            const [card] = await CardModel.create([{
                name,
                description: "",
                position: pos,
                dueDate: null,
                slug,
                list: listId,
                attachments: [],
                comments: [],
                members: [],
                createdBy: user._id,
                checklists: [],
            }], { session })

            list.cards.push(card._id as mongoose.Types.ObjectId)
            await list.save({ session })

            await session.commitTransaction()
            await session.endSession()

            const successResponse = new ApiResponse(200, card, "Card created successfully");
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession()

            console.log("Error in making card:", error);
            const errResponse = new ApiResponse(500, null, "Error creating card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error creating card", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}