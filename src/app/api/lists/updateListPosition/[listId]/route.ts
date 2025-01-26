import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import ListModel from "@/models/List.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";

export async function PATCH(req: Request, { params }: { params: { listId: string } }) {
    await dbConnect()
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const { listId } = params
    const { searchParams } = new URL(req.url)
    
    const pos = Number(searchParams.get('pos'))

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

    try {
        const list = await ListModel.findById(listId);
        if (!list) {
            const errResponse = new ApiResponse(404, null, "List not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        list.position = pos
        await list.save()

        const successResponse = new ApiResponse(200, list, "List position updated successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error updating list name", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}