import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
    id_tmdb: { type: Number, required: true, unique: true, index: true },
    id_imdb: { type: String, required: false, index: true },
    title: { type: String, required: false, trim: true },
    overview: { type: String, default: "" },
    release_year: { type: Number, min: 1800 },
    poster: { type: String, default: null },
    backdrop: { type: String, default: null },
    rating: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 },
    genres: [Number],
    type: { type: String, enum: ['movie', 'tv'], required: true },
    
    // Datos generales de series
    seasons: { type: Number, default: 0 },
    episodes: { type: Number, default: 0 },

    // --- EL CAMPO QUE FALTA: Detalle de episodios ---
    seasons_details: [{
        season_number: Number,
        episodes: [{
            episode_number: Number,
            title: String,
            overview: String,
            air_date: String
        }]
    }]
    
}, { 
    timestamps: true 
});

// --- ÍNDICES PARA BUSCADOR ---

// Búsqueda de texto
movieSchema.index({ title: 'text', overview: 'text' }, { 
    weights: { title: 10, overview: 2 }, 
    name: "TextSearchIndex" 
});

// Filtros + Orden
movieSchema.index({ type: 1, popularity: -1 });
movieSchema.index({ type: 1, rating: -1 });

// Filtros por género y año
movieSchema.index({ genres: 1, release_year: -1 });

// Orden cronológico
movieSchema.index({ release_year: -1 });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;