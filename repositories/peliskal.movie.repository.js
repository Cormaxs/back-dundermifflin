import Movie from '../model/peliskal.movie.model.js';

class MovieRepository {
    async findAll() {
        return await Movie.find();
    }

    async findByIdtmdb(id) {
    // Buscamos un documento donde el campo id_tmdb sea igual al id 
    // O donde el campo id_imdb sea igual al id
    return await Movie.findOne({
        $or: [
            { id_tmdb: id },
            { id_imdb: id }
        ]
    });
}

    async create(movieData) {
        return await Movie.create(movieData);
    }

    async update(id, movieData) {
        return await Movie.findByIdAndUpdate(id, movieData, { new: true });
    }

    async delete(id) {
        return await Movie.findByIdAndDelete(id);
    }

    async findByTmdbId(id_tmdb) {
        return await Movie.findOne({ id_tmdb });
    }




    async findWithFilters({ query, genres, type, minRating, year, page = 1, limit = 20 }) {
        const filters = {};

        // Búsqueda por texto (Título) - Case Insensitive
        if (query) {
            filters.title = { $regex: query, $options: 'i' };
        }

        // Filtro por Géneros (Busca si el array contiene los IDs)
        if (genres) {
            const genreIds = genres.split(',').map(Number);
            filters.genres = { $in: genreIds };
        }

        // Filtro por tipo (movie o tv)
        if (type) filters.type = type;

        // Filtro por Rating mínimo
        if (minRating) filters.rating = { $gte: parseFloat(minRating) };

        // Filtro por Año exacto
        if (year) filters.release_year = parseInt(year);

        const skip = (page - 1) * limit;

        // Ejecutamos la búsqueda y el conteo total en paralelo para optimizar tiempo
        const [data, total] = await Promise.all([
            Movie.find(filters)
                .sort({ popularity: -1 }) // Ordenamos por lo más popular primero
                .skip(skip)
                .limit(limit)
                .lean(), // lean() hace la consulta mucho más rápida (devuelve POJO, no documentos Mongoose)
            Movie.countDocuments(filters)
        ]);

        return {
            movies: data,
            pagination: {
                totalResults: total,
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        };
    }

}

export default new MovieRepository();