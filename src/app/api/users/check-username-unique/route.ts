import { ApiResponse } from "@/utils/ApiResponse";
import { usernameValidation } from "@/schemas/signUpSchema";
import { z } from "zod";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";

const UsernameQuerySchema = z.object({
    username: usernameValidation
})

export async function GET(req: Request) {
    await dbConnect()

    try {
        const { searchParams } = new URL(req.url)
        const queryParam = {
            username: searchParams.get('username')
        }

        const result = UsernameQuerySchema.safeParse(queryParam)
        if (!result.success) {
            const usernameErrors = result.error.format().username?._errors || []

            const errMsg = usernameErrors.length > 0 ? usernameErrors.join(', ') : "Invalid query parameters"

            const errResponse = new ApiResponse(400, null, errMsg);
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { username } = result.data

        const existingUser = await UserModel.findOne({ username, isVerified: true })

        if (existingUser) {
            const errResponse = new ApiResponse(200, null, "Username is already taken");
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { "Content-Type": "application/json" },
            });
        }

        const successResponse = new ApiResponse(200, null, "Username is available");
        return new Response(JSON.stringify(successResponse), {
            status: successResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.log("Error checking unique username", error);
        const errResponse = new ApiResponse(500, null, "Internal server error");
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { "Content-Type": "application/json" },
        });
    }
}