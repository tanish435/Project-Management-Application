import { z } from "zod";

export const todoSchema = z.object({
    content: z.string()
        .min(1, { message: "Todo content should be at least 3 characters" })
        .max(500, { message: "Todo content can contain at most 500 characters" })
})

export const toggleTodoSchema = z.object({
    todoState: z.boolean()
})

export const todoPosSchema = z.object({
    pos: z
        .number()
        .int()
        .nonnegative({message: "Position must be non-negative"})
})