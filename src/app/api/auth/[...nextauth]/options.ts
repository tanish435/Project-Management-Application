import { NextAuthOptions, User } from "next-auth";
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
            async authorize(
                credentials: Record<"identifier" | "password", string> | undefined,
                // req: Pick<RequestInternal, "body" | "query" | "headers" | "method">
            ): Promise<User | null> {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new ApiError(400, "Missing credentials");
                }

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
                    if (!isPasswordCorrect) {
                        throw new ApiError(400, "Incorrect password");
                    }

                    return {
                        id: user._id as string,
                        _id: user._id as string,
                        isVerified: user.isVerified,
                        username: user.username,
                        name: user.fullName,
                        email: user.email,
                        image: user.avatar,
                        initials: user.initials,
                        sub: user.sub || user._id as string 
                    };

                } catch (error: unknown) {
                    console.error(error);
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
        async jwt({ token, user, profile, account }) {
            if (user) {
                if (account?.provider === "google") {
                    token.sub = profile?.sub

                    await dbConnect()
                    let existingUser = await UserModel.findOne({ sub: token.sub })
                    if (!existingUser) {
                        const baseUsername = user.name?.toLowerCase().replace(/\s+/g, "_") || "user";
                        let uniqueUsername = baseUsername;
                        let suffix = 0;

                        // Ensure username is unique
                        while (await UserModel.findOne({ username: uniqueUsername })) {
                            suffix += 1;

                            const randomSuffix = Math.floor(Math.random() * 1000); // Random number between 0-999
                            uniqueUsername = `${baseUsername}_${suffix}_${randomSuffix}`;
                        }

                        const initials = user.name?.split(" ").map(word => word[0]).join("").toUpperCase() || "";
                        existingUser = await UserModel.create({
                            sub: token.sub,
                            username: uniqueUsername.toLowerCase(),
                            fullName: user.name,
                            isVerified: true,
                            avatar: user.image,
                            email: user.email,
                            initials: initials,
                        });
                    }

                    token._id = existingUser._id as string
                    token.isVerified = existingUser.isVerified
                    token.username = existingUser.username
                    token.image = existingUser.avatar as string
                    token.initials = existingUser.initials
                } else if (account?.provider === "credentials") {
                    token._id = user._id
                    token.isVerified = user.isVerified
                    token.username = user.username
                    token.image = user.image as string
                    token.initials = user.initials
                }
            }

            if (token._id) {
                const updatedUser = await UserModel.findById(token._id)
                if (updatedUser) {
                    token.image = updatedUser.avatar
                }
            }

            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user._id = token._id
                session.user.isVerified = token.isVerified
                session.user.username = token.username
                session.user.sub = token.sub as string
                session.user.image = token.image
                session.user.initials = token.initials as string
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