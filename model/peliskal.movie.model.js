import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
    id_tmdb: { type: Number, required: true, unique: true, index: true },
    id_imdb: { type: String, required: false, index: true }, // Quité el unique por si TMDB manda IDs vacíos
    title: { type: String, required: false, trim: true },
    overview: { type: String, default: "" },
    release_year: { type: Number, min: 1800 },
    poster: { type: String, default: null },
    backdrop: { type: String, default: null },
    rating: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    genres: [Number],
    type: { type: String, enum: ['movie', 'tv'], required: true },
    seasons: Number,
    episodes: Number
}, { 
    timestamps: true 
});

// --- ÍNDICES PARA BUSCADOR ---

// 1. Búsqueda de texto (Crucial para buscadores por palabra clave)
// Permite buscar términos en el título y descripción con prioridad en el título
movieSchema.index({ title: 'text', overview: 'text' }, { 
    weights: { title: 10, overview: 2 }, 
    name: "TextSearchIndex" 
});

// 2. Índice compuesto para Filtros + Orden (Popularidad/Rating)
// Útil cuando el usuario filtra por tipo y quiere ver las más populares primero
movieSchema.index({ type: 1, popularity: -1 });
movieSchema.index({ type: 1, rating: -1 });

// 3. Índice para filtros por año y género
movieSchema.index({ genres: 1, release_year: -1 });

// 4. Índice para orden cronológico (Estrenos)
movieSchema.index({ release_year: -1 });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;