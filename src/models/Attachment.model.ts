import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface Attachment extends Document {
    url: string;
    isWebsiteLink: boolean;
    name: string;
    attachedBy: Types.ObjectId;
    card: Types.ObjectId;
}

const AttachmentSchema: Schema<Attachment> = new Schema ({
    url: {
        type: String,
        required: [true, 'Website or File link is required']
    },
    isWebsiteLink: {
        type: Boolean,
    },
    name: {
        type: String
    },
    attachedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    card: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
    }
}, {timestamps: true})

const AttachmentModel = (mongoose.models.Attachment as Model<Attachment>) || mongoose.model("Attachment", AttachmentSchema)

export default AttachmentModel