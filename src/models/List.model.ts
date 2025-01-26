import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface List extends Document {
    name: string;
    createdBy: Types.ObjectId;
    position: number;
    cards: Types.ObjectId[];
    board: Types.ObjectId;
}

const ListSchema: Schema<List> = new Schema ({
    name: {
        type: String,
        required: [true, 'List name is required']
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    position: {
        type: Number,
    },
    cards: [{
        type: Schema.Types.ObjectId,
        ref: 'Card'
    }],
    board: {
        type: Schema.Types.ObjectId,
        ref: 'Board'
    }
}, {timestamps: true})

const ListModel = (mongoose.models.List as Model<List>) || mongoose.model("List", ListSchema)

export default ListModel