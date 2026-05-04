import MovieService from '../services/peliskal.movie.service.js';

class MovieController {
    async getAll(req, res) {
        try {
            const movies = await MovieService.getAllMovies();
            res.json(movies);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getByIdtmdb(req, res) {
        try {
            
            const movie = await MovieService.getMovieByIdtmdb(req.params.id_tmdb);
            res.json(movie);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            const newMovie = await MovieService.createMovie(req.body);
            res.status(201).json(newMovie);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const updatedMovie = await MovieService.updateMovie(req.params.id, req.body);
            res.json(updatedMovie);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async delete(req, res) {
        try {
            await MovieService.deleteMovie(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }



    async search(req, res) {
        try {
            // Ejemplo de URL: /peliskal/search?query=avengers&type=movie&page=1
            const results = await MovieService.searchMovies(req.query);
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

export default new MovieController();