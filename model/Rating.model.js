import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
    // La puntuación del 1 al 5
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    // Referencia al libro que se está calificando
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookDundderMifflin',
        required: true,
        // Eliminamos el índice individual aquí para no duplicar. 
        // El índice compuesto de abajo lo cubrirá de manera más eficiente.
    },
    // Referencia al usuario que realizó la calificación
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDundderMifflin',
        required: true
    }
}, {
    timestamps: true
});

// Índice Compuesto Principal y de Unicidad
// 1. `book: 1`: Principal para consultas sobre un libro específico (ej. "dame todas las calificaciones del libro X").
// 2. `user: 1`: Permite la búsqueda eficiente de la calificación de un usuario para un libro.
// `unique: true` asegura que un par de (libro, usuario) sea único.
ratingSchema.index({ book: 1, user: 1 }, { unique: true });

// Nuevo Índice Adicional para Consultas de Usuario
// Este índice es crucial para obtener todas las calificaciones de un usuario de forma rápida.
// Por ejemplo, "dame todos los libros que ha calificado el usuario Y".
ratingSchema.index({ user: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;