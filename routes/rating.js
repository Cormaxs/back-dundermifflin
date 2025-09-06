import { Router } from 'express';
import { rateBook, rateUserBooks} from '../controllers/rating.controller.js';

export const Rating = Router();

// Define la ruta para calificar un libro
// Acepta los parámetros bookId, userId y newRating en la URL
Rating.post('/:bookId/:userId/:newRating/', rateBook);

Rating.get('/list/:userId', rateUserBooks);