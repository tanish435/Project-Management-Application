import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { deleteFromCloudinary, uploadOnCloudinary } from "@/utils/cloudinary";
import { writeFile } from "fs/promises";
import { User, getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function PATCH(req: Request) {
    await dbConnect()
    const session = await getServerSession(authOptions)
    const user: User = session?.user as User

    if(!session || !session.user) {
        const errResponse = new ApiResponse(401, null, "Not authenticated")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }

    try {
        const data = await req.formData();
        const userId = data.get('userId')
        const avatar = data.get('avatar')
        
        if(!avatar || !(avatar instanceof Blob)) {
            const errResponse = new ApiResponse(400, null, "Avatar is required")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const user = await UserModel.findById(userId)
        if (!user) {
            const errResponse = new ApiResponse(404, null, "User not found")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const byteData = await avatar.arrayBuffer()
        const buffer = Buffer.from(byteData)
        const path = `./public/temp/${avatar.name}`
        
        await writeFile(path, buffer)

        const uploadResult = await uploadOnCloudinary(path)

        if(!uploadResult?.url) {
            throw new ApiError(500, 'Error while uploading avatar')
        }

        if(user.avatar) {
            await deleteFromCloudinary(user.avatar)
        }

        user.avatar = uploadResult.url
        await user.save()

        const response = new ApiResponse(200, user.avatar, "User avatar changed successfully")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    } catch (error) {
        console.log('Error changing the avatar of the user ', error);
        const errResponse = new ApiResponse(500, null, "Internal Server Error")
        return new Response(JSON.stringify(errResponse), {
            status: errResponse.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}