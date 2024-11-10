import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface Comment extends Document {
    content: string;
    owner: Types.ObjectId;
    card: Types.ObjectId; 
}

const CommentSchema: Schema<Comment> = new Schema ({
    content: {
        type: String,
        required: [true, 'Comment content is required']
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    card: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
    }
}, {timestamps: true})

const CommentModel = (mongoose.models.Comment as Model<Comment>) || mongoose.model("Comment", CommentSchema)

export default CommentModel