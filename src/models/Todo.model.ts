import mongoose, { Document, Model, Schema, Types } from "mongoose";
import ChecklistModel from "./Checklist.model";

export interface Todo extends Document {
    content: string;
    complete: boolean;
    pos: number;
    assignedTo: Types.ObjectId[];
    createdBy: Types.ObjectId;
    checklist: Types.ObjectId;
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
    checklist: {
        type: Schema.Types.ObjectId,
        ref: 'Checklist',
    },
    assignedTo: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, {timestamps: true})

TodoSchema.pre("findOneAndDelete", async function(next) {
    const todoId = this.getQuery()._id

    const checklist = await ChecklistModel.findOneAndUpdate(
        {todos: todoId},
        {
            $pull: {todos: todoId}
        },
        {new: true}
    )

    if(!checklist) {
        return next(new Error("Checklist not found"))
    }

    next()
})

const TodoModel = (mongoose.models.Todo as Model<Todo>) || mongoose.model("Todo", TodoSchema)

export default TodoModel