// models/book.model.js
import mongoose from 'mongoose';

// Define el esquema para el libro
const bookSchema = new mongoose.Schema({
    // Título del libro, es un campo requerido
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    // URL de la portada, requerida
    portada: {
        type: String,
        required: true
    },
    // Sinopsis del libro, requerida y con un mínimo de 10 caracteres
    sinopsis: {
        type: String,
        required: false,
        trim: true,
        minlength: 0
    },
    // Autor del libro, requerido
    autor: {
        type: String,
        required: true,
        trim: true
    },
    // Categorías del libro, un array de strings
    categorias: {
        type: [String],
        required: true,
        default: []
    },
    // Enlace de descarga, requerido
    link: {
        type: String,
        required: true
    },
    year: {
        type: Number,
        required: true,
      },
}, {
    // Añade automáticamente campos para la fecha de creación y actualización
    timestamps: true
});
// ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
bookSchema.index({ titulo: 'text', autor: 'text', categorias: 'text' }); // Índice de texto compuesto
bookSchema.index({ titulo: 1 }); // Índice ascendente para título
bookSchema.index({ autor: 1 }); // Índice ascendente para autor  
bookSchema.index({ categorias: 1 }); // Índice para categorías (array)
bookSchema.index({ year: 1 }); // Índice para año
bookSchema.index({ titulo: 1, autor: 1 }); // Índice compuesto para búsquedas combinadas


// Crea el modelo 'Book' a partir del esquema
const Book = mongoose.model('BookDundderMifflin', bookSchema);

export default Book;