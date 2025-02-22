import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import CardModel from "@/models/Card.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

export async function GET(req: Request, { params }: { params: { cardId: string } }) {
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
        const errResponse = new ApiResponse(400, null, "Invalid list ID");
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

        const authorisedUsers = validUsers[0]?.listInfo[0]?.board[0]?.members || []
        if (!authorisedUsers.some((memberId: mongoose.Types.ObjectId) => memberId.equals(user._id))) {
            const errResponse = new ApiResponse(400, null, "You are not authorised to view this card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const members = await CardModel.aggregate([
            {
                $match: { _id: new mongoose.Types.ObjectId(cardId) }
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
                                fullName: 1,
                                email: 1,
                                avatar: 1,
                                initials: 1,
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

        

        if (!members || members.length === 0) {
            const errResponse = new ApiResponse(200, null, "No members assigned to card");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, members, "Card members fetched successfully");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error fetching card members", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}