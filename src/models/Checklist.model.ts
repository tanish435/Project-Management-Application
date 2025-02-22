import mongoose, { Document, Model, Schema, Types } from "mongoose";
import TodoModel from "./Todo.model";
import CardModel from "./Card.model";

export interface Checklist extends Document {
    name: string;
    createdBy: Types.ObjectId;
    card: Types.ObjectId;
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
    card: {
        type: Schema.Types.ObjectId,
        ref: 'Card',
    },
    todos: [{
        type: Schema.Types.ObjectId,
        ref: 'Todo'
    }]
}, {timestamps: true})

ChecklistSchema.pre('findOneAndDelete', async function(next) {
    const checklistId = this.getQuery()._id

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        await TodoModel.deleteMany({ checklist: checklistId }).session(session);
        
        await CardModel.updateOne(
            { checklists: checklistId },
            { $pull: { checklists: checklistId } }
        ).session(session);
        
        await session.commitTransaction();
        session.endSession();
        next();
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
})

const ChecklistModel = (mongoose.models.Checklist as Model<Checklist>) || mongoose.model("Checklist", ChecklistSchema)

export default ChecklistModel