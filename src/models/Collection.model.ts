import mongoose, {Document, Schema, Model, Types} from "mongoose";

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
}, {timestamps: true})

const CollectionModel = (mongoose.models.Collection as Model<Collection>) || mongoose.model("Collection", CollectionSchema)

export default CollectionModel