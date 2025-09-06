import * as ratingRepository from '../repositories/rating.repository.js';
import * as bookRepository from '../repositories/book.repository.js';

/**
 * Procesa la lógica de calificar un libro.
 * @param {string} bookId - El ID del libro.
 * @param {string} userId - El ID del usuario.
 * @param {number} newRating - La nueva puntuación del 1 al 5.
 */
export const handleBookRating = async (bookId, userId, newRating) => {
    // 1. Verificar si el usuario ya calificó el libro
    const existingRating = await ratingRepository.findByBookAndUser(bookId, userId);
    if (existingRating) {
        throw new Error('Ya has calificado este libro.');
    }

    // 2. Crear una nueva calificación
    const ratingData = {
        rating: newRating,
        book: bookId,
        user: userId
    };
    await ratingRepository.createRating(ratingData);

    // 3. Encontrar el libro y calcular sus nuevas métricas
    const book = await bookRepository.findBookById(bookId);
    if (!book) {
        throw new Error('Libro no encontrado.');
    }

    // 4. Calcular el nuevo promedio de forma eficiente
    const oldTotal = book.averageRating * book.totalRatingsCount;
    const newTotalCount = book.totalRatingsCount + 1;
    const newAverage = (oldTotal + newRating) / newTotalCount;

    // 5. Actualizar el documento del libro y guardarlo
    book.averageRating = newAverage;
    book.totalRatingsCount = newTotalCount;
    await bookRepository.updateBookRatingMetrics(book);
    
    // Devolvemos el libro actualizado
    return book;
};


export const getUserRatings = async (userId) => {
    return await ratingRepository.findRatingsByUser(userId);
}