import mongoose, {Schema, Document, Types, Model} from "mongoose";
import AttachmentModel from "./Attachment.model";
import ChecklistModel from "./Checklist.model";
import TodoModel from "./Todo.model";
import ListModel from "./List.model";
import CommentModel from "./Comment.model";
import { deleteFromCloudinary } from "@/utils/cloudinary";

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

CardSchema.pre('findOneAndDelete', async function (next) {
    const cardId = this.getQuery()._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const attachments = await AttachmentModel.find({card: cardId}).session(session)

        for(const attachement of attachments) {
            if(!attachement.isWebsiteLink) {
                await deleteFromCloudinary(attachement.url)
            }
        }
        
        await AttachmentModel.deleteMany({ card: cardId }).session(session);
        await CommentModel.deleteMany({ card: cardId }).session(session);

        const checklists = await ChecklistModel.find({ card: cardId }).session(session);
        const checklistIds = checklists.map(checklist => checklist._id);

        await TodoModel.deleteMany({ checklist: { $in: checklistIds } }).session(session);

        await ChecklistModel.deleteMany({ card: cardId }).session(session);

        await ListModel.updateOne(
            { cards: cardId },
            { $pull: { cards: cardId } }
        ).session(session);

        await session.commitTransaction();
        session.endSession();
        next();
    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
});


const CardModel = (mongoose.models.Card as Model<Card>) || mongoose.model("Card", CardSchema)

export default CardModel