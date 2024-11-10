import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface List extends Document {
    name: string;
    createdBy: Types.ObjectId;
    cards: Types.ObjectId[];
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
    cards: [{
        type: Schema.Types.ObjectId,
        ref: 'Card'
    }]
}, {timestamps: true})

const ListModel = (mongoose.models.List as Model<List>) || mongoose.model("List", ListSchema)

export default ListModel