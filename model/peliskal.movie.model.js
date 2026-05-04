import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
    id_tmdb: { type: Number, required: true, unique: true, index: true },
    id_imdb: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
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

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;