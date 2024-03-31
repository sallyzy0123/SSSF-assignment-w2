// TODO: mongoose schema for user
import mongoose from 'mongoose';
import { User } from '../../types/DBTypes';

const userSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true,
    },
    user_name: {
        type: String,
        minlength: [3, 'Username must be at least 3 characters long'],
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'user'],
    },
    password: {
        type: String,
        minlength: [4, 'Password must be at least 4 characters long'],
    }
});

export default mongoose.model<User>('User', userSchema)