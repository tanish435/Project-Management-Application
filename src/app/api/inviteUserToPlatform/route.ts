import dbConnect from "@/lib/dbConnect";
import { authOptions } from "../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { ApiResponse } from "@/utils/ApiResponse";
import { sendInvitationEmail } from "@/helpers/sendInviteEmail";

export async function POST(req: Request) {
    await dbConnect()
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const {email} = await req.json()
        if(!email) {
            const errResponse = new ApiResponse(400, null, "Invalid email")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        // send invite email to user
        const emailResponse =  await sendInvitationEmail(session.user.username, email, "Project Management Platform")
        
        const successResponse = new ApiResponse(200, emailResponse, "Invitation email sent successfully")
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        const errResponse = new ApiResponse(500, null, "Internal server error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}