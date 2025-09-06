import * as ratingService from '../services/rating.service.js';

/**
 * Controlador para la ruta de calificación de libros.
 * Gestiona la solicitud y llama al servicio para procesar la lógica de negocio.
 * @param {object} req - Objeto de solicitud de Express.
 * @param {object} res - Objeto de respuesta de Express.
 */
export const rateBook = async (req, res) => {
    try {
        // Extraemos los parámetros de la URL
        const { bookId, userId, newRating } = req.params;
        //console.log(`Calificando libro ${bookId} por usuario ${userId} con calificación ${newRating}`);

        // Validamos que la calificación sea un número válido y esté en el rango 1-5
        const rating = parseInt(newRating, 10);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'La calificación debe ser un número entre 1 y 5.' });
        }

        // Llamamos al servicio para manejar la lógica
        const updatedBook = await ratingService.handleBookRating(bookId, userId, rating);
       // console.log(updatedBook)
        res.status(200).json({
            message: 'Calificación registrada exitosamente.',
            data: updatedBook
        });
    } catch (error) {
        if (error.message === 'Ya has calificado este libro.' || error.message === 'Libro no encontrado.') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};


export const rateUserBooks = async (req, res) => {
    try {
        const { userId } = req.params;
        const ratings = await ratingService.getUserRatings(userId);
        res.status(200).json({
            message: 'Calificaciones del usuario obtenidas exitosamente.',
            data: ratings
        });
    } catch (error) {
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
}