import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface AttachmentList extends Document {
    url: string;
    isWebsiteLink: boolean;
    attachedBy: Types.ObjectId;
}

const AttachmentListSchema: Schema<AttachmentList> = new Schema ({
    url: {
        type: String,
        required: [true, 'Website or File link is required']
    },
    isWebsiteLink: {
        type: Boolean,
    },
    attachedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, {timestamps: true})

const AttachmentListModel = (mongoose.models.AttachmentList as Model<AttachmentList>) || mongoose.model("AttachmentList", AttachmentListSchema)

export default AttachmentListModel