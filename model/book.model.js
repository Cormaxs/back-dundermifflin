import mongoose from 'mongoose';

// Define el esquema para el libro
const bookSchema = new mongoose.Schema({
    // Título del libro, es un campo requerido y debe ser único
    titulo: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // URL de la portada, requerida
    portada: {
        type: String,
        required: false
    },
    // Sinopsis del libro
    sinopsis: {
        type: String,
        required: false,
        trim: true,
        minlength: 0
    },
    // Autor del libro, requerido
    autor: {
        type: String,
        required: false,
        trim: false
    },
    // Categorías del libro, un array de strings
    categorias: {
        type: [String],
        required: false,
        default: []
    },
    // Enlace de descarga, requerido
    link: {
        type: String,
        required: true
    },
    // Tipo de archivo (ej. 'PDF', 'EPUB', 'MOBI'), requerido
    fileType: {
        type: String,
        required: false,
        trim: false
    },
    // Referencia al ID del usuario que creó el libro, requerido
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDundderMifflin',
        required: false
    },
    // Campos para el sistema de calificación
    averageRating: {
        type: Number,
        default: 0,
        required: true
    },
    totalRatingsCount: {
        type: Number,
        default: 0,
        required: true
    }
}, {
    // Añade automáticamente campos para la fecha de creación y actualización
    timestamps: true
});

// Índices para optimizar búsquedas
bookSchema.index({ titulo: 'text', autor: 'text', categorias: 'text' });
bookSchema.index({ autor: 1 });
bookSchema.index({ categorias: 1 });
bookSchema.index({ creator: 1 }); // Índice para el creador
bookSchema.index({ fileType: 1 }); // Índice para el tipo de archivo

// Crea el modelo 'Book' a partir del esquema
const Book = mongoose.model('BookDundderMifflin', bookSchema);

export default Book;
