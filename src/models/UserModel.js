import mongoose from 'mongoose'
import { maxLength, minLength } from 'zod'
import { required } from 'zod/mini'

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            default: '',
            required: true,
            trim: true,
            lowercase: true,
            minLength: 15,
            maxLength: 75,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            minLength: 6,
            maxLength: 254,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            minLength: 6,
            maxLength: 254,
        },
        isAdmin: {
            type: Boolean,
            default: false,
            required: true,
        },
    },
    { timestamps: true }
)

const User = new mongoose.model('User', userSchema)

export default User
