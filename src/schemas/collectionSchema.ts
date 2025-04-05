import {z} from "zod"

export const createCollectionSchema = z.object({
    name: z.string().min(1).max(300),
    boardIds: z.array(z.string().regex(/^[a-f\d]{24}$/i))
});
