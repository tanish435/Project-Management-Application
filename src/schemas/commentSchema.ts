import { z } from "zod";

export const commentSchema = z.object({
    content: z
                .string()
                .min(2, "Comment must be at least 2 characters")
                .max(300, "Comment must be at most 300 characters")
})