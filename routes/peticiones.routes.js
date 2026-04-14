import { Router } from 'express';
import * as peticionesController from '../controllers/peticiones.controller.js';
import { verifyToken, isAdmin, allowUserOrAdmin } from '../middlewares/auth.js';

export const peticiones = Router();

// Cualquier usuario logueado puede pedir un libro
peticiones.post('/', verifyToken, peticionesController.create);

// Admin ve todas las peticiones, users ven solo las suyas
peticiones.get('/', verifyToken, allowUserOrAdmin, peticionesController.list);
peticiones.post('/:idPeticion', verifyToken, isAdmin, peticionesController.updateStatus);

