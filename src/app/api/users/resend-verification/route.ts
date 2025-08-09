import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User.model';
import bcryptjs from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail';
import dbConnect from '@/lib/dbConnect';

export async function POST(request: NextRequest) {
    await dbConnect();

    try {
        const { username } = await request.json();

        // Validate required fields
        if (!username) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Username is required"
                },
                { status: 400 }
            );
        }

        // Find user by username
        const existingUser = await User.findOne({ username });

        if (!existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User not found"
                },
                { status: 404 }
            );
        }

        // Check if user is already verified
        if (existingUser.isVerified) {
            return NextResponse.json(
                {
                    success: false,
                    message: "User is already verified"
                },
                { status: 400 }
            );
        }

        // Check if user can request a new code (rate limiting)
        const now = new Date();
        const lastCodeSent = existingUser.verifyCodeExpiry;
        
        // Allow resend only if more than 1 minute has passed since last code
        if (lastCodeSent && now.getTime() - lastCodeSent.getTime() < 60000) {
            const remainingTime = Math.ceil((60000 - (now.getTime() - lastCodeSent.getTime())) / 1000);
            return NextResponse.json(
                {
                    success: false,
                    message: `Please wait ${remainingTime} seconds before requesting a new code`
                },
                { status: 429 }
            );
        }

        // Generate new verification code
        const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedVerifyCode = await bcryptjs.hash(verifyCode, 10);

        // Update user with new verification code
        existingUser.verifyCode = hashedVerifyCode;
        existingUser.verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        await existingUser.save();

        // Send verification email
        const emailResponse = await sendVerificationEmail(
            existingUser.email,
            existingUser.username,
            verifyCode
        );

        if (!emailResponse) {
            return NextResponse.json(
                {
                    success: false,
                    message: emailResponse || "Failed to send verification email"
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Verification code sent successfully"
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error resending verification code:", error);
        
        return NextResponse.json(
            {
                success: false,
                message: "Error resending verification code"
            },
            { status: 500 }
        );
    }
}