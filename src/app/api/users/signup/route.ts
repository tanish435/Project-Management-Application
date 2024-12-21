import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/models/User.model";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import bcrypt from "bcryptjs"

function getInitials(name: string) {
    if (!name || typeof name !== 'string') return ''; // Fallback if name is invalid
    const nameSplit = name.split(' ');
    const firstWord = nameSplit[0] ? nameSplit[0].charAt(0) : '';
    const secondWord = nameSplit[1] ? nameSplit[1].charAt(0) : '';
    return (firstWord + secondWord).toUpperCase();
}

export async function POST(req: Request) {
    await dbConnect()

    try {
        const { fullName, username, email, password } = await req.json()

        if ([fullName, email, password, username].some((field) => field?.trim() === "")) {
            throw new ApiError(400, 'All fields are required')
        }

        const existingUserVerifiedByUsername = await UserModel.findOne({
            username,
            isVerified: true
        })

        if (existingUserVerifiedByUsername) {
            const errResponse = new ApiResponse(400, null, "Username already taken")
            return new Response(JSON.stringify(errResponse), {
                status: errResponse.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const existingUserByEmail = await UserModel.findOne({ email })
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

        const initials = getInitials(fullName)

        if (existingUserByEmail) {
            if (existingUserByEmail.isVerified) {
                const errResponse = new ApiResponse(400, null, "User already exists with this email")
                return new Response(JSON.stringify(errResponse), {
                    status: errResponse.statusCode,
                    headers: { 'Content-Type': 'application/json' }
                })
            }

            const hashedPassword = await bcrypt.hash(password, 10)
            existingUserByEmail.fullName = fullName
            existingUserByEmail.password = hashedPassword
            existingUserByEmail.verifyCode = verifyCode
            existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000)
            existingUserByEmail.initials = initials

            await existingUserByEmail.save()
        } else {
            const hashedPassword = await bcrypt.hash(password, 10)
            const codeExpiry = new Date()
            codeExpiry.setHours(codeExpiry.getHours() + 1) 

            const newUser = new UserModel({
                username,
                fullName,
                initials,
                email,
                password: hashedPassword,
                avatar: "",
                verifyCode,
                verifyCodeExpiry: codeExpiry,
                isVerified: false,
                boards: [],
                collections: [],
            })

            await newUser.save()
        }

        // Send verification email
        const emailRes = await sendVerificationEmail(username, email, verifyCode)
        if(emailRes.status !== 200 ) {
            const emailRes = new ApiResponse(400, null, "Failed to send message")
            return new Response(JSON.stringify(emailRes), {
                status: emailRes.statusCode,
                headers: { 'Content-Type': 'application/json' }
            })
        }

        const response = new ApiResponse(200, null, "User resgistered successfully. Verify your email")
        return new Response(JSON.stringify(response), {
            status: response.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.log("Error registering user");
        const errMsg = new ApiResponse(500, null, `Internal Server Error, ${error}`)

        return new Response(JSON.stringify(errMsg), {
            status: errMsg.statusCode,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}