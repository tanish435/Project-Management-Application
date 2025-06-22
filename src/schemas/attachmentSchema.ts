import { z } from "zod";

export const fileSchema = z.object({
    file: z
        .instanceof(File)
        .refine(file => file.size <= 2 * 1024 * 1024, {
            message: "File size must be less than 2 MB"
        })
        .refine(file => {
            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx for Excel
            ]

            return allowedTypes.includes(file.type)
        }, {
            message: "Invalid file type. Only JPEG, PNG, GIF, PDF, PPT, DOCX, and similar files are allowed."
        })
})

export const urlSchema = z.object({
    url: z.string().url(),
    displayName: z.string().max(300)
})

export const attachmentSchema = z.union([fileSchema, urlSchema])