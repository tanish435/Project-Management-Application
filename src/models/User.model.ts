import mongoose, { Document, Schema, Types } from "mongoose";

export interface User extends Document {
    username: string;
    fullName: string;
    initials: string;
    email: string;
    password: string;
    avatar: string;
    verifyCode: string;
    verifyCodeExpiry: Date;
    isVerified: boolean;
    boards: Types.ObjectId[];
    collections: Types.ObjectId[];
}

const UserSchema: Schema<User> = new Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        trim: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: [true, "Full name is required"],
    },
    initials: {
        type: String,
        required: [true, "Choose valid initials"],
        uppercase: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        match: [/.+\@.+\..+/, 'please use a valid email address']
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    avatar: {
        type: String,
    },
    verifyCode: {
        type: String,
        required: [true, "Verify code is required"],
    },
    verifyCodeExpiry: {
        type: Date,
        required: [true, "Verify code expiry is required"],
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    boards: [{
        type: Schema.Types.ObjectId,
        ref: 'Board'
    }],
    collections: [{
        type: Schema.Types.ObjectId,
        ref: 'Collection'
    }]
}, {timestamps: true})

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User", UserSchema)

export default UserModel