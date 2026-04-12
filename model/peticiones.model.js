// models/request.model.js
import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDundderMifflin',
        required: true
    },
    nombreLibro: {
        type: String,
        required: true,
        trim: true
    },
    autor: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pendiente', 'en_busqueda', 'subido', 'no_encontrado'],
        default: 'pendiente'
    },
    prioridad: {
        type: Boolean, // true si es usuario Erudito Pro
        default: false
    },
    adminNote: String // Nota opcional por si el admin quiere decir algo
}, { timestamps: true });

// Índice para que el admin vea primero los pendientes y prioritarios
requestSchema.index({ status: 1, prioridad: -1, createdAt: 1 });

const Peticiones = mongoose.model('Peticiones', requestSchema);
export default Peticiones;