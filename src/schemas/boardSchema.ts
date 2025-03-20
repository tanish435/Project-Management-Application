import {z} from "zod"

export const createBoardSchema = z.object({
    name: z.string().max(300).min(1),
    bgColor: z.string()
})