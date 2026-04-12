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



const extractIdFromSlug = (slug) => {
    // Intentamos extraer el ID de 24 caracteres al final del slug
    const parts = slug.split('-');
   
    const potentialId = parts[parts.length - 1];
  
    return potentialId;
};



export const findBySlugOrId = async (slugOrId) => {
    // ⭐️ Nuevo paso: Extraer el ID único del slug completo.
    // Asumimos que extractIdFromSlug devuelve el ID o null.
    const bookId = extractIdFromSlug(slugOrId);
    //console.log("ID extraído para búsqueda:", bookId);

    // ⭐️ CORRECCIÓN: Validar que bookId exista (no sea null) Y que sea un ObjectId válido.
    if (bookId) {
       // console.log("Iniciando búsqueda en la base de datos por ID:", bookId);
        // ✅ Ahora sí, esperamos la respuesta de la base de datos
        const libro = await Book.findById(bookId);
        return libro;
    }

    // Si bookId era null, o no era válido, o la búsqueda anterior falló, retorna null.
    //console.log("Búsqueda no iniciada: ID no válido o nulo.");
    return null;
};

// Tu función original findById se mantiene para usos internos si es necesario, pero la reemplazaremos en el Service
// export const findById = async (id) => {
//     return await Book.findById(id).lean();
// };

// ⭐️ Tienes dos funciones findBookById en el repositorio, consolidamos findById para usar el slug.

/**
 * Busca un libro por su ID (versión para mongoose document).
 * @param {string} bookId - El ID del libro.
 * @returns {Promise<object>} El documento del libro.
 */
export const findBookByIdDocument = async (bookId) => {
    return await Book.findById(bookId);
};



//buscador mejorado 
export const searchBooks = async (filters) => {
    const { 
        q, 
        page = 1, 
        limit = 12, 
        idioma, 
        anio, 
        fileType,
        autor,
        isPremium,
        categorias 
    } = filters;

    const skip = (page - 1) * limit;
    let queryCondition = {};

    // 1. Búsqueda Global (Barra de búsqueda principal)
    if (q) {
        const regex = new RegExp(q, 'i');
        queryCondition.$or = [
            { titulo: { $regex: regex } },
            { autor: { $regex: regex } },
            { categorias: { $elemMatch: { $regex: regex } } }
        ];
    }

    // 2. Filtro Específico de Categorías (Array)
    if (categorias) {
        const catList = Array.isArray(categorias) 
            ? categorias 
            : categorias.split(',').map(c => c.trim()).filter(c => c !== "");

        if (catList.length > 0) {
            // Buscamos libros que tengan AL MENOS UNA de las categorías seleccionadas
            queryCondition.categorias = { 
                $in: catList.map(cat => new RegExp(cat, 'i')) 
            };
        }
    }

    // 3. Filtro Específico de Autor
    if (autor) {
        queryCondition.autor = { $regex: new RegExp(autor, 'i') };
    }

    // 4. Filtro de Formato (fileType) - Sensible al error que mencionaste
    if (fileType) {
        // Usamos regex para que 'pdf' encuentre 'PDF', 'Pdf', etc.
        queryCondition.fileType = { $regex: new RegExp(`^${fileType}$`, 'i') };
    }

    // 5. Filtro de Idioma e isPremium
    if (idioma) queryCondition.idioma = idioma.toLowerCase();
    
    if (isPremium !== undefined && isPremium !== "") {
        queryCondition.isPremium = isPremium === 'true';
    }

    if (anio) queryCondition.anio = parseInt(anio);

    try {
        // Ejecución optimizada
        const [books, totalCount] = await Promise.all([
            Book.find(queryCondition)
                .select("-link") 
                .sort({ totalRatingsCount: -1, averageRating: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Book.countDocuments(queryCondition)
        ]);

        return {
            books,
            metadata: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        };
    } catch (error) {
        throw new Error("Error en la consulta de base de datos: " + error.message);
    }
};