import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface Todo extends Document {
    content: string;
    complete: boolean;
    pos: number
    createdBy: Types.ObjectId;
}

const TodoSchema: Schema<Todo> = new Schema ({
    content: {
        type: String,
        required: [true, 'Content is required']
    },
    complete: {
        type: Boolean,
        default: false
    },
    pos: {
        type: Number,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, {timestamps: true})

const TodoModel = (mongoose.models.Todo as Model<Todo>) || mongoose.model("Todo", TodoSchema)

export default TodoModel