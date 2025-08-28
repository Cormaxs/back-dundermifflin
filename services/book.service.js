// services/book.service.js
import * as bookRepository from "../repositories/book.repository.js";

export const findAllBooks = async (page, limit) => {
  return await bookRepository.findAll(page, limit);
};

export const findBookById = async (id) => {
  return await bookRepository.findById(id);
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