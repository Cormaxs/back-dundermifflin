import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
    titulo: { type: String, required: true, unique: true, trim: true },
    portada: { type: String, required: false },
    sinopsis: { type: String, required: false, trim: true },
    autor: { type: String, required: false, trim: true },
    categorias: { type: [String], default: [] },
    link: { type: String, required: true },
    ouo: { type: String, required: false },
    
    // --- CAMPOS PARA EL BUSCADOR MEJORADO ---
    idioma: { 
        type: String, 
        default: 'español', 
        lowercase: true, 
        trim: true 
    },
    anio: { 
        type: Number, 
        index: true // Índice numérico para rangos de fechas (ej. libros de 2020 a 2024)
    },
    paginas: { 
        type: Number 
    },
    fileType: { 
        type: String, 
        uppercase: true, // Para que siempre guarde 'PDF' o 'EPUB'
        default: 'PDF' 
    },
    // ---------------------------------------

    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'UserDundderMifflin' },
    averageRating: { type: Number, default: 0 },
    totalRatingsCount: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    isExclusive: { type: Boolean, default: false }
}, {
    timestamps: true
});

// ÍNDICES OPTIMIZADOS
// Agregamos 'idioma' al índice de texto para búsquedas globales
bookSchema.index({ titulo: 'text', autor: 'text', categorias: 'text', idioma: 'text' });

// Índices simples para filtros rápidos desde el sidebar
bookSchema.index({ autor: 1 });
bookSchema.index({ categorias: 1 });
bookSchema.index({ anio: -1 }); // Indexamos por año descendente (lo más nuevo primero)
bookSchema.index({ idioma: 1 });
bookSchema.index({ fileType: 1 });

const Book = mongoose.model('BookDundderMifflin', bookSchema);
export default Book;