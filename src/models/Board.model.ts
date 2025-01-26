import mongoose, { Document, Model, Schema, Types } from "mongoose";
import ListModel from "./List.model";
import CardModel from "./Card.model";
import AttachmentListModel from "./AttachmentList.model";
import CommentModel from "./Comment.model";
import ChecklistModel from "./Checklist.model";
import TodoModel from "./Todo.model";

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

BoardSchema.pre('findOneAndDelete', async function(next) {
    const boardId = this.getQuery()._id

    const lists = await ListModel.find({board: boardId})

    for(const list of lists) {
        const cards = await CardModel.find({list: list._id})

        for(const card of cards) {
            await AttachmentListModel.deleteMany({_id: {$in: card.attachments}})

            await CommentModel.deleteMany({card: card._id})

            const checklists = await ChecklistModel.find({_id: {$in: card.checklists}})

            for(const checklist of checklists) {
                await TodoModel.deleteMany({_id: {$in: checklist.todos}})
            }

            await ChecklistModel.deleteMany({_id: {$in: card.checklists}})
        }

        await CardModel.deleteMany({list: list._id})
    }

    await ListModel.deleteMany({board: boardId})

    next();
})

const BoardModel = (mongoose.models.Board as Model<Board>) || mongoose.model("Board", BoardSchema)

export default BoardModel