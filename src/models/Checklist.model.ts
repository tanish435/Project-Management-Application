import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface Checklist extends Document {
    name: string;
    createdBy: Types.ObjectId;
    todos: Types.ObjectId[]; 
}

const ChecklistSchema: Schema<Checklist> = new Schema ({
    name: {
        type: String,
        required: [true, 'Checklist name is required'],
        default: "Checklist"
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    todos: [{
        type: Schema.Types.ObjectId,
        ref: 'Todo'
    }]
}, {timestamps: true})

const ChecklistModel = (mongoose.models.Checklist as Model<Checklist>) || mongoose.model("Checklist", ChecklistSchema)

export default ChecklistModel