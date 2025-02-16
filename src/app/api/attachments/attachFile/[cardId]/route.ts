import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import AttachmentModel from "@/models/Attachment.model";
import CardModel from "@/models/Card.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { uploadOnCloudinary } from "@/utils/cloudinary";
import { writeFile } from "fs/promises";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { User } from "next-auth";

export async function POST(req: Request, { params }: { params: { cardId: string } }) {
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

    const { cardId } = params
    if (!mongoose.Types.ObjectId.isValid(cardId)) {
        const errResponse = new ApiResponse(400, null, "Invalid card ID");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const data = await req.formData()
        const file = data.get('file')

        if (!file || !(file instanceof File)) {
            const errResponse = new ApiResponse(400, null, "File is required");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

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
            const errResponse = new ApiResponse(400, null, "You are not authorised to view this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const byteData = await file.arrayBuffer()
        const buffer = Buffer.from(byteData)
        const path = `./public/temp/${file.name}`

        await writeFile(path, buffer)
        const uploadResult = await uploadOnCloudinary(path)

        if (!uploadResult?.url) {
            throw new ApiError(500, 'Error while uploading file')
        }

        const session = await mongoose.startSession()
        await session.startTransaction()

        try {
            const [attachFile] = await AttachmentModel.create([{
                url: uploadResult.url,
                isWebsiteLink: false,
                attachedBy: user._id,
                card: cardId,
                name: file.name
            }], {session})

            const updateCard = await CardModel.findByIdAndUpdate(
                cardId,
                {
                    $addToSet: { attachments: attachFile._id }
                },
                { new: true, session }
            )

            if (!updateCard) {
                await session.abortTransaction()
                await session.endSession()

                const errResponse = new ApiResponse(400, null, "Failed to update card");
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { "Content-Type": "application/json" },
                });
            }

            await session.commitTransaction()
            await session.endSession()

            const successResponse = new ApiResponse(200, attachFile, "File attached successfully");
            return new Response(JSON.stringify(successResponse), {
                status: successResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            await session.abortTransaction()
            await session.endSession()

            const errResponse = new ApiResponse(500, null, "Failed to attach file");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }
    } catch (error) {
        console.log("Error attaching file:", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}