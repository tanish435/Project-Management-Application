import { ApiResponse } from "@/utils/ApiResponse";
import mongoose, { Document, Schema, Model, Types } from "mongoose";
import UserModel from "./User.model";

export interface Collection extends Document {
    name: string;
    owner: Types.ObjectId;
    boards: Types.ObjectId[];
}

const CollectionSchema: Schema<Collection> = new Schema({
    name: {
        type: String,
        required: [true, 'Collection name is required']
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    boards: [{
        type: Schema.Types.ObjectId,
        ref: 'Board'
    }]
}, { timestamps: true })

CollectionSchema.pre('findOneAndDelete', async function (next) {
    const collectionId = this.getQuery()._id

    const collection = await CollectionModel.findById(collectionId)
    if (!collection) {
        return next(new Error("Collection not found"))
    }

    await UserModel.findByIdAndUpdate(
        collection.owner,
        { $pull: { collections: collectionId } }
    );

    next()
})

const CollectionModel = (mongoose.models.Collection as Model<Collection>) || mongoose.model("Collection", CollectionSchema)

export default CollectionModel