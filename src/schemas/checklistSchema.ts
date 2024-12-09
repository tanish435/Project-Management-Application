import { z } from "zod";

export const checklistNameSchema = z.object({
    checklistName: z
                    .string()
                    .min(2, "Checklist name must be at least 2 characters")
                    .max(100, "Checklist name must be at most 100 characters")
})