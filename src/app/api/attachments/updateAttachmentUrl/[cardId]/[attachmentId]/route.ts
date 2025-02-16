import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import AttachmentModel from "@/models/Attachment.model";
import CardModel from "@/models/Card.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: { cardId: string, attachmentId: string } }) {
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

    const { cardId, attachmentId } = params
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid card ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
    if (!mongoose.Types.ObjectId.isValid(attachmentId)) {
        const errResponse = new ApiResponse(400, null, "Invalid attachment ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    const urlSchema = z.string().url({ message: 'Invalid url' })

    try {
        const { url } = await req.json()
        const validatedUrl = urlSchema.parse(url)

        const validUsers = await CardModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(cardId) }
            },
            {
                $lookup: {
                    from: "lists",
                    localField: "list",
                    foreignField: "_id",
                    as: "listInfo",
                    pipeline: [
                        {
                            $lookup: {
                                from: "boards",
                                localField: "board",
                                foreignField: "_id",
                                as: "board",
                                pipeline: [
                                    {
                                        $project: {
                                            members: 1,
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ])

        if (!validUsers.length || !validUsers[0]?.listInfo.length) {
            const errResponse = new ApiResponse(404, null, "Card or associated data not found");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const authorisedUsers = validUsers[0]?.listInfo[0]?.board[0]?.members || []
        if (!authorisedUsers.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
            const errResponse = new ApiResponse(403, null, "You are not authorised to view this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const attachment = await AttachmentModel.findById(attachmentId)
        if(!attachment?.isWebsiteLink) {
            const errResponse = new ApiResponse(404, null, "Cannot update file url");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const updatedAttachment = await AttachmentModel.findByIdAndUpdate(
            attachmentId,
            { $set: { url: validatedUrl } },
            { new: true }
        );

        const successResponse = new ApiResponse(200, updatedAttachment, "Attachment url updated successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error updating link:", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}