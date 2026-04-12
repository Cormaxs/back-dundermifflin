import { Router } from 'express';
import * as peticionesController from '../controllers/peticiones.controller.js';
// Asumo que tienes un middleware de auth
//import { verifyToken, isAdmin } from '../middlewares/auth.js'; 

export const peticiones = Router();

// Cualquier usuario logueado puede pedir un libro
peticiones.post('/', peticionesController.create);

// Solo el admin puede ver la cola completa y actualizar estados
peticiones.get('/', peticionesController.list);
peticiones.patch('/:id',  peticionesController.updateStatus);

