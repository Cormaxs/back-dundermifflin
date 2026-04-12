// models/comment.model.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookDundderMifflin',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDundderMifflin',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    isDeleted: { // Moderación suave
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Índice para cargar rápido los comentarios de un libro (el más reciente primero)
commentSchema.index({ book: 1, createdAt: -1 });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;