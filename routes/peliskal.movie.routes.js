import { Router } from 'express';
import MovieController from '../controllers/peliskal.movie.controller.js';

const peliskal = Router();

// Definición de rutas CRUD
//buscador con filtros y paginación
peliskal.get('/search', MovieController.search);

peliskal.get('/', MovieController.getAll);
peliskal.get('/:id_tmdb', MovieController.getByIdtmdb);
peliskal.post('/', MovieController.create);
peliskal.put('/:id', MovieController.update);
peliskal.delete('/:id', MovieController.delete);



export default peliskal; 