import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface Board extends Document {
    name: string;
    bgColor: string;
    url: string;  // Check : How to create unique url for every board
    admin: Types.ObjectId;
    members: Types.ObjectId[]; 
    lists: Types.ObjectId[];
}

const BoardSchema: Schema<Board> = new Schema ({
    name: {
        type: String,
        required: [true, 'Board name is required']
    },
    bgColor: {
        type: String,
        default: "blue"
    },
    url: {
        type: String,
        unique: true // Not sure
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    lists: [{
        type: Schema.Types.ObjectId,
        ref: 'List'
    }]
}, {timestamps: true})

const BoardModel = (mongoose.models.Board as Model<Board>) || mongoose.model("Board", BoardSchema)

export default BoardModel