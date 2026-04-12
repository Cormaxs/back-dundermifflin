// services/book.service.js
import * as bookRepository from "../repositories/book.repository.js";

export const findAllBooks = async (page, limit) => {
  return await bookRepository.findAll(page, limit);
};

export const findBookById = async (slugOrId) => {
  // Llama a la nueva función que puede manejar la extracción del ID del slug.
  //console.log("Servicio - findBookById llamado con:", slugOrId);
  const res = await bookRepository.findBySlugOrId(slugOrId);
  //console.log("Servicio - Resultado de la búsqueda:", res);
  return res;
};

export const createBook = async (bookData) => {
  try {
    return await bookRepository.create(bookData);

  } catch (error) {
    console.error("Error en la función createBook:", error);
    throw error; // Re-lanza el error para que se maneje en un nivel superior
  }
};

export const updateBook = async (id, updateData) => {
  return await bookRepository.findByIdAndUpdate(id, updateData);
};

export const deleteBook = async (id) => {
  return await bookRepository.findByIdAndRemove(id);
};

export const searchBooksService = async (query, page, limit) => {
  return await bookRepository.search(query, page, limit);
};


//buscador de libros mas especifico y profesional
export const buscarBooks = async (filters) => {
  return await bookRepository.searchBooks(filters);
};