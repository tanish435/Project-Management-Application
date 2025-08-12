import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendInvitationEmail } from "@/helpers/sendInviteEmail";
import dbConnect from "@/lib/dbConnect";
import BoardModel from "@/models/Board.model";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";
import mongoose from "mongoose";
import { getServerSession, User } from "next-auth";

// Get email of the user
// check whether the user exists in the database
// if user does not exist, send a invite email to user to register on the platform
// if the user exists, add the user to the board

export async function PATCH(req: Request, context: { params: Promise<{ boardId: string }> }) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User
    const { boardId } = await context.params

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const { email } = await req.json()
        const board = await BoardModel.findById(boardId)
        if (!board) {
            const errResponse = new ApiResponse(404, null, "Board not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // if(!board.admin.equals(user._id)) {
        //     const errResponse = new ApiResponse(403, null, "You are not authorised to add members")
        //     return new Response(JSON.stringify(errResponse), {
        //         status: errResponse.statusCode,
        //         headers: { 'Content-Type': 'application/json' }
        //     })
        // }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            const errResponse = new ApiResponse(400, null, "Invalid email format");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const doesUserExist = await UserModel.findOne({ email })
        if (!doesUserExist) {
            // send invite email to user
            const emailRes = await sendInvitationEmail(user.username, email, board.name)
            if (!emailRes.success) {
                const emailRes = new ApiResponse(400, null, "Failed to send message")
                return new Response(JSON.stringify(emailRes), {
                    status: emailRes.statusCode,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            const response = new ApiResponse(200, null, "Invitation email sent to user")
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        if(board.members.includes(new mongoose.Types.ObjectId(doesUserExist._id as string))) {
            const errResponse = new ApiResponse(202, null, "User already a member of the board")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const addBoardToUser = await UserModel.updateOne(
            { _id: doesUserExist._id },
            { $addToSet: { boards: new mongoose.Types.ObjectId(boardId) } }
        )

        if (!addBoardToUser) {
            const errResponse = new ApiResponse(400, null, "Failed to add board to user")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const updatedBoard = await BoardModel.findByIdAndUpdate(
            boardId,
            { $addToSet: { members: doesUserExist._id } },
            { new: true }
        ).populate('members', 'fullName username email avatar initials')

        if (!updatedBoard) {
            const errResponse = new ApiResponse(400, null, "Failed to add board member")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const successResponse = new ApiResponse(200, { 
            email, 
            boardId, 
            updatedMembers: updatedBoard.members 
        }, "User added to board successfully")
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log("Error adding member to board: ", error);
        const errResponse = new ApiResponse(500, null, "Internal server error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}