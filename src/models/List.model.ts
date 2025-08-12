import mongoose, { Document, Model, Schema, Types } from "mongoose";
import CardModel from "./Card.model";
import CommentModel from "./Comment.model";
import AttachmentModel from "./Attachment.model";
import ChecklistModel from "./Checklist.model";
import TodoModel from "./Todo.model";
import { deleteFromCloudinary } from "@/utils/cloudinary";

export interface List extends Document {
    name: string;
    createdBy: Types.ObjectId;
    position: number;
    cards: Types.ObjectId[];
    board: Types.ObjectId;
}

const ListSchema: Schema<List> = new Schema({
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
}, { timestamps: true })

ListSchema.pre("findOneAndDelete", async function (next) {
    const listId = this.getQuery()._id

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const cards = await CardModel.find({ list: listId }).session(session)

        for (const card of cards) {
            const cardId = card._id

            const attachments = await AttachmentModel.find({ card: cardId }).session(session)

            for (const attachement of attachments) {
                if (!attachement.isWebsiteLink) {
                    await deleteFromCloudinary(attachement.url)
                }
            }

            await AttachmentModel.deleteMany({ card: cardId }).session(session)
            await CommentModel.deleteMany({ card: cardId }).session(session)

            const checklists = await ChecklistModel.find({ card: cardId }).session(session)
            for (const checklist of checklists) {
                await TodoModel.deleteMany({ checklist: checklist._id }).session(session)
                await ChecklistModel.findOneAndDelete({ _id: checklist._id }).session(session)
            }

            await CardModel.findOneAndDelete({ _id: cardId }).session(session)
        }

        await session.commitTransaction();
        session.endSession();
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

const ListModel = (mongoose.models.List as Model<List>) || mongoose.model("List", ListSchema)

export default ListModel