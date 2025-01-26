import dbConnect from "@/lib/dbConnect";
import { getServerSession, User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import CardModel from "@/models/Card.model";
import generateUniqueUrlId from "@/utils/generateUrlId";

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

        const slug = await generateUniqueUrlId()

        const card = await CardModel.create({
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
        })

        if (!card) {
            const errResponse = new ApiResponse(500, null, "Failed to create card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, card, "Card created successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error creating card", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}