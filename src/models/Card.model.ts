import mongoose, {Schema, Document, Types, Model} from "mongoose";

export interface Card extends Document {
    name: string;
    description: string;
    position: number;
    slug: string;
    dueDate: Date;
    createdBy: Types.ObjectId;
    list: Types.ObjectId;
    members: Types.ObjectId[];
    comments: Types.ObjectId[];
    checklists: Types.ObjectId[];
    attachments: Types.ObjectId[];
}

const CardSchema: Schema<Card> = new Schema ({
    name: {
        type: String,
        required: [true, 'Card name is required']
    },
    description: {
        type: String,
    },
    position: {
        type: Number,
    },
    slug:{
        type: String,
        required: [true, "Card slug is required"]
    },
    dueDate: {
        type: Date,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    list: {
        type: Schema.Types.ObjectId,
        ref: 'List',
        required: [true, "List ID is required to create card"]
    },
    members: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    checklists: [{
        type: Schema.Types.ObjectId,
        ref: 'Checklist'
    }],
    attachments: [{
        type: Schema.Types.ObjectId,
        ref: 'Attachment'
    }]
}, {timestamps: true})

const CardModel = (mongoose.models.Card as Model<Card>) || mongoose.model("Card", CardSchema)

export default CardModel