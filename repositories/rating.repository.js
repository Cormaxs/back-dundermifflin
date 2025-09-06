import Rating from '../model/Rating.model.js';

/**
 * Busca una calificación por el ID del libro y el ID del usuario.
 * @param {string} bookId - El ID del libro.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<object>} El objeto de calificación si existe, de lo contrario null.
 */
export const findByBookAndUser = async (bookId, userId) => {
  return await Rating.findOne({ book: bookId, user: userId });
};

/**
 * Crea una nueva calificación en la base de datos.
 * @param {object} ratingData - Los datos de la calificación (rating, book, user).
 */
export const createRating = async (ratingData) => {
  return await Rating.create(ratingData);
};


export const findRatingsByUser = async (userId) => {
    return await Rating.find({ user: userId }).populate('book', 'title author averageRating totalRatingsCount');
}