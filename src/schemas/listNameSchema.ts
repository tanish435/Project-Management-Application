import { z } from "zod";

export const listNameSchema = z.object({
    listName: z.string().max(100, "List name must be at most 100 characters")
})