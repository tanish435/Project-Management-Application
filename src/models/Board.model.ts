import mongoose, { Document, Model, Schema, Types } from "mongoose";
import ListModel from "./List.model";
import CardModel from "./Card.model";
import CommentModel from "./Comment.model";
import ChecklistModel from "./Checklist.model";
import TodoModel from "./Todo.model";
import AttachmentModel from "./Attachment.model";
import { deleteFromCloudinary } from "@/utils/cloudinary";

export interface Board extends Document {
    name: string;
    bgColor: string;
    url: string;
    admin: Types.ObjectId;
    members: Types.ObjectId[];
    lists: Types.ObjectId[];
}

const BoardSchema: Schema<Board> = new Schema({
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
        unique: true 
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
}, { timestamps: true })

BoardSchema.pre('findOneAndDelete', async function (next) {
    const boardId = this.getQuery()._id

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const lists = await ListModel.find({ board: boardId }).session(session)
        const listIds = lists.map(list => list._id);

        const cards = await CardModel.find({list: {$in: listIds}}).session(session)
        const cardIds = cards.map(card => card._id)

        const attachements = await AttachmentModel.find({card: {$in: cardIds}}).session(session)
        for(const attachement of attachements) {
            if(!attachement.isWebsiteLink) {
                await deleteFromCloudinary(attachement.url)
            }
        }

        await AttachmentModel.deleteMany({card: {$in: cardIds}}).session(session)
        await CommentModel.deleteMany({card: {$in: cardIds}}).session(session)

        const checklists = await ChecklistModel.find({card: {$in: cardIds}}).session(session)
        const checklistIds = checklists.map(checklist => checklist._id)

        await TodoModel.deleteMany({checklist: {$in: checklistIds}}).session(session)
        await ChecklistModel.deleteMany({card: {$in: cardIds}}).session(session)

        await CardModel.deleteMany({list: {$in: listIds}}).session(session)
        await ListModel.deleteMany({board: boardId}).session(session)

        await session.commitTransaction();
        session.endSession();
        console.log('Pre-hook completed successfully');
        next()
    } catch (error: unknown) {
        await session.abortTransaction();
        session.endSession();
    
        if (error instanceof Error) {
            next(error as mongoose.CallbackError);
        } else {
            next(new Error(String(error)));
        }
    }
})

const BoardModel = (mongoose.models.Board as Model<Board>) || mongoose.model("Board", BoardSchema)

export default BoardModel