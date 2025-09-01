// repositories/book.repository.js
import Book from "../model/book.model.js";

export const findAll = async (page, limit) => {
  // Calcular el número de elementos a saltar (skip)
  const skip = (page - 1) * limit;

  // Realizar las dos consultas en paralelo:
  // 1. Obtener el total de documentos para la metadata de paginación
  // 2. Obtener los documentos de la página actual, usando skip y limit
  const [books, totalCount] = await Promise.all([
    Book.find({}).skip(skip).limit(limit).exec(),
    Book.countDocuments({})
  ]);

  // Calcular el número total de páginas
  const totalPages = Math.ceil(totalCount / limit);

  // Devolver los datos de los libros y la metadata de paginación
  return {
    books,
    totalCount,
    totalPages
  };
};

export const findById = async (id) => {
  return await Book.findById(id).lean();
};

export const create = async (bookData) => {
  const newBook = new Book(bookData);
  return await newBook.save();
};

export const findByIdAndUpdate = async (id, updateData) => {
  return await Book.findByIdAndUpdate(id, updateData, { new: true });
};

export const findByIdAndRemove = async (id) => {
  return await Book.findByIdAndDelete(id);
};



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
      // Apply .lean() here to return plain JavaScript objects
      Book.find(searchConditions)
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ score: { $meta: "textScore" } })
        .lean() // <--- This is the key change
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