// controllers/book.controller.js
import * as bookService from "../services/book.service.js";

export const findAll = async (req, res) => {
  try {
    // Extraer los parámetros de la consulta para paginación
    const page = parseInt(req.query.page) || 1; // Página por defecto es 1
    const limit = parseInt(req.query.limit) || 10; // Límite por defecto es 10

    const { books, totalCount, totalPages } = await bookService.findAllBooks(page, limit);

    // Enviar los libros y metadatos de paginación en la respuesta
    res.status(200).json({
      data: books,
      meta: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const findOne = async (req, res) => {
  try {
    const book = await bookService.findBookById(req.params.idBook);
    if (!book) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    console.log(req.body);
    const newBook = await bookService.createBook(req.body);
    res.status(201).json({success: true,
      user: newBook});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    console.log(req.body)
    const updatedBook = await bookService.updateBook(req.params.idBook, req.body);
    if (!updatedBook) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }
    res.status(200).json({success: true,
      user: updatedBook});
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const deletedBook = await bookService.deleteBook(req.params.idBook);
    if (!deletedBook) {
      return res.status(404).json({ message: "Libro no encontrado" });
    }
    res.status(200).json({ message: "Libro eliminado con éxito" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const searchBooks = async (req, res) => {
  try {
    console.log("entro a search")
    console.log(req.query);
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ message: "Se requiere un parámetro de búsqueda 'q'." });
    }

    const { books, totalCount, totalPages } = await bookService.searchBooksService(q, page, limit);

    res.status(200).json({
      data: books,
      metadata: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};