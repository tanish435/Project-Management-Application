import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface Attachment extends Document {
    name: string;
    attachmentList: Types.ObjectId[]; 
}

const AttachmentSchema: Schema<Attachment> = new Schema ({
    name: {
        type: String,
        required: [true, 'Attachment name is required'],
        default: "Attachment"
    },    
    attachmentList: [{
        type: Schema.Types.ObjectId,
        ref: 'AttachmentList'
    }]
}, {timestamps: true})

const AttachmentModel = (mongoose.models.Attachment as Model<Attachment>) || mongoose.model("Attachment", AttachmentSchema)

export default AttachmentModel