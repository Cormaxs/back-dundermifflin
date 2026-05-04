import MovieRepository from '../repositories/peliskal.movie.repository.js';

class MovieService {
    async getAllMovies() {
        return await MovieRepository.findAll();
    }

    async getMovieByIdtmdb(id_tmdb) {
        const movie = await MovieRepository.findByIdtmdb(id_tmdb);
        if (!movie) throw new Error('Película no encontrada');
        return movie;
    }

    async createMovie(movieData) {
        // Ejemplo de lógica: evitar duplicados por ID de TMDB
        const exists = await MovieRepository.findByTmdbId(movieData.id_tmdb);
        if (exists) throw new Error('La película ya existe en la base de datos');
        
        return await MovieRepository.create(movieData);
    }

    async updateMovie(id, movieData) {
        return await MovieRepository.update(id, movieData);
    }

    async deleteMovie(id) {
        return await MovieRepository.delete(id);
    }

    async searchMovies(params) {
        // Aquí podrías agregar lógica de negocio, como guardar qué buscan los usuarios
        return await MovieRepository.findWithFilters(params);
    }
}

export default new MovieService();