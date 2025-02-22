import mongoose, { Document, Model, Schema, Types } from "mongoose";
import CardModel from "./Card.model";

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

CommentSchema.pre('findOneAndDelete', async function(next) {
    const commentId = this.getQuery()._id

    const comment = await CommentModel.findById(commentId)
    if(!comment) {
        return next(new Error("Comment not found"));
    }

    await CardModel.findOneAndUpdate(
        {_id: this.getQuery().card},
        {
            $pull: {comments: commentId}
        }
    )

    next()
})

const CommentModel = (mongoose.models.Comment as Model<Comment>) || mongoose.model("Comment", CommentSchema)

export default CommentModel