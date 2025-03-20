import { z } from "zod";

export const usernameValidation = z
    .string()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must not contain any special characters")

export const signUpSchema = z.object({
    username: usernameValidation,
    fullName: z.string().min(2).max(100),
    email: z.string().email({message: "Invalid email address"}),
    password: z
                .string()
                .min(8, "Username must be at least 8 characters")
                .max(20, "Username must be at most 20 characters")
})