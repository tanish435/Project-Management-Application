import { NextAuthOptions, Profile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs'
import UserModel from "@/models/User.model";
import { ApiError } from "@/utils/ApiError";
import dbConnect from "@/lib/dbConnect";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                identifier: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any> {
                await dbConnect()
                try {
                    const user = await UserModel.findOne({
                        $or: [
                            { email: credentials.identifier },
                            { username: credentials.identifier }
                        ]
                    })

                    if (!user) {
                        throw new ApiError(404, "User not found")
                    }

                    if (!user.isVerified) {
                        throw new ApiError(401, "Please verify your account before login")
                    }

                    const isPasswordCorrect = await bcrypt.compare(credentials.password, user.password)

                    if (isPasswordCorrect) {
                        return {
                            _id: user._id,
                            isVerified: user.isVerified,
                            username: user.username,
                            name: user.fullName,
                            email: user.email,
                            image: user.avatar,
                        };
                    } else {
                        throw new ApiError(400, "Incorrect Password")
                    }
                } catch (error: any) {
                    console.log(error);

                    throw new ApiError(500, "Error signing in the user via Credentials")
                }
            }
        }),
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
            authorization: {
                params: {
                    scope: "openid email profile",
                },
            },
        })
    ],
    callbacks: {
        async jwt({ token, user, profile }) {
            if (user) {
                token._id = user._id
                token.isVerified = user.isVerified
                token.username = user.username
                token.sub = profile?.sub
            }

            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user._id = token._id
                session.user.isVerified = token.isVerified
                session.user.username = token.username
                session.user.sub = token.sub as string
            }

            return session
        }
    },
    // pages: {
    //     signIn: '/sign-in'
    // },
    session: {
        strategy: 'jwt'
    },
    secret: process.env.NEXTAUTH_SECRET
}