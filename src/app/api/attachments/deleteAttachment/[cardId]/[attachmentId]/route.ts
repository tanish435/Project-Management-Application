import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import AttachmentModel from "@/models/Attachment.model";
import CardModel from "@/models/Card.model";
import { ApiResponse } from "@/utils/ApiResponse";
import { deleteFromCloudinary } from "@/utils/cloudinary";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function DELETE(req: Request, { params }: { params: { cardId: string, attachmentId: string } }) {
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

    try {
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

        const session = await mongoose.startSession()
        session.startTransaction()

        try {
            const attachment = await AttachmentModel.findOne({ _id: attachmentId, card: cardId }).session(session)
            if (!attachment) {
                await session.abortTransaction()
                session.endSession()

                const errResponse = new ApiResponse(404, null, "Attachment not found or does not belong to this card");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            if (!attachment.isWebsiteLink) {
                const deleteFile = await deleteFromCloudinary(attachment.url).catch(async (error) => {
                    await session.abortTransaction();
                    session.endSession();
                    console.log("Error deleting from Cloudinary:", error);
                    const errResponse = new ApiResponse(500, null, "Failed to delete attachment from Cloudinary");
                    return new Response(JSON.stringify(errResponse), {
                        status: errResponse.statusCode,
                        headers: { "Content-Type": "application/json" },
                    });
                });
            }

            await AttachmentModel.findByIdAndDelete(attachmentId).session(session)

            const updateCard = await CardModel.findByIdAndUpdate(
                cardId,
                {
                    $pull: { attachments: attachmentId }
                },
                { new: true }
            ).session(session)

            if (!updateCard) {
                await session.abortTransaction();
                session.endSession()

                return new Response(JSON.stringify(new ApiResponse(500, null, "Failed to update card")), {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                });
            }

            await session.commitTransaction()
            session.endSession()

            const successResponse = new ApiResponse(200, null, "Attachment deleted successfully");
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            
            console.log(error, 'check');
            

            const errResponse = new ApiResponse(400, null, "Failed to delete attachment");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error deleting atachment:", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}