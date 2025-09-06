// repositories/book.repository.js
import Book from "../model/book.model.js";

/**
 * Busca todos los libros con paginación.
 * @param {number} page - El número de página actual.
 * @param {number} limit - La cantidad de libros por página.
 * @returns {Promise<object>} Un objeto con los libros, el conteo total y el total de páginas.
 */
export const findAll = async (page, limit) => {
    const skip = (page - 1) * limit;

    const [books, totalCount] = await Promise.all([
        Book.find({})
            .sort({
                averageRating: -1, // Ordena por calificación promedio (mejor a peor)
                _id: -1            // Luego, por fecha de creación (más reciente a más antiguo)
            })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        Book.countDocuments({})
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
        books,
        totalCount,
        totalPages
    };
};

/**
 * Busca un libro por su ID.
 * @param {string} id - El ID del libro.
 * @returns {Promise<object>} El objeto del libro.
 */
export const findById = async (id) => {
    return await Book.findById(id).lean();
};

/**
 * Crea un nuevo libro.
 * @param {object} bookData - Los datos del nuevo libro.
 * @returns {Promise<object>} El nuevo libro creado.
 */
export const create = async (bookData) => {
    const newBook = new Book(bookData);
    return await newBook.save();
};

/**
 * Encuentra un libro por su ID y lo actualiza.
 * @param {string} id - El ID del libro.
 * @param {object} updateData - Los datos a actualizar.
 * @returns {Promise<object>} El libro actualizado.
 */
export const findByIdAndUpdate = async (id, updateData) => {
    return await Book.findByIdAndUpdate(id, updateData, { new: true });
};

/**
 * Encuentra un libro por su ID y lo elimina.
 * @param {string} id - El ID del libro.
 * @returns {Promise<object>} El libro eliminado.
 */
export const findByIdAndRemove = async (id) => {
    return await Book.findByIdAndDelete(id);
};

/**
 * Realiza una búsqueda de libros por una consulta de texto.
 * @param {string} query - El término de búsqueda.
 * @param {number} page - El número de página.
 * @param {number} limit - El límite de resultados por página.
 * @returns {Promise<object>} Un objeto con los resultados de la búsqueda.
 */
export const search = async (query, page, limit) => {
    try {
        const skip = (page - 1) * limit;

        let searchConditions = {
            $text: {
                $search: query,
                $caseSensitive: false,
                $diacriticSensitive: false
            }
        };

        const [books, totalCount] = await Promise.all([
            Book.find(searchConditions)
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ score: { $meta: "textScore" } })
                .lean()
                .exec(),
            Book.countDocuments(searchConditions)
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            books,
            totalCount,
            totalPages,
        };
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        throw new Error('Error al realizar la búsqueda');
    }
};

// Funciones específicas para la lógica de calificación
/**
 * Busca un libro por su ID y retorna un documento de Mongoose.
 * @param {string} bookId - El ID del libro.
 * @returns {Promise<object>} El documento del libro.
 */
export const findBookById = async (bookId) => {
    return await Book.findById(bookId);
};

/**
 * Guarda las métricas de calificación actualizadas en un documento de libro.
 * @param {object} book - El documento del libro a actualizar.
 * @returns {Promise<void>}
 */
export const updateBookRatingMetrics = async (book) => {
    await book.save();
};
