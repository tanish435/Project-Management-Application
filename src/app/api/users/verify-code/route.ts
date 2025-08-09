import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { ApiResponse } from "@/utils/ApiResponse";

export async function POST(req: Request) {
    await dbConnect()

    try {
        const { username, code } = await req.json()
        const decodedUsername = decodeURIComponent(username)

        const user = await UserModel.findOne({ username: decodedUsername })
        if (!user) {
            const errResponse = new ApiResponse(400, null, "User does not exist")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const isCodeValid = user.verifyCode === code
        const isCodeNotExpired = new Date() < new Date(user.verifyCodeExpiry)

        if (isCodeValid && isCodeNotExpired) {
            user.isVerified = true
            await user.save()

            const response = new ApiResponse(200, null, "User verified successfully")
            return new Response(JSON.stringify(response), {
                status: response.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        } else if (!isCodeNotExpired) {
            const errResponse = new ApiResponse(400, null, "Verification code is expired")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        } else {
            const errResponse = new ApiResponse(400, null, "Invalid verification code")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    } catch (error) {
        console.log(error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}