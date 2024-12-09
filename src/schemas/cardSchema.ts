import { z } from "zod";

export const cardNameSchema = z.object({
    listName: z.string().max(100, "Card name must be at most 100 characters")
})

export const descriptionSchema = z.object({
    description: z.string().max(5000, "Description must be at most 5000 characters")
})

export const cardDueSchema = z.object({
    date: z.date({message: "Invalid date format"})
})