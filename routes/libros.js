// routes/books.js
import { Router } from "express";
import * as bookController from "../controllers/book.controller.js";

export const books = Router();

//nuevo buscador de libros mas especifico y profesional

books.get("/buscadormejorado", bookController.buscarBooks);


// Ruta para obtener todos los libros
books.get("/", bookController.findAll);
books.get("/search", bookController.searchBooks);
// Ruta para obtener un libro por su ID
books.get("/:idBook", bookController.findOne);

// Ruta para crear un nuevo libro
books.post("/", bookController.create);

// Ruta para actualizar un libro por su ID
books.post("/:idBook", bookController.update);

// Ruta para eliminar un libro por su ID
books.delete("/:idBook", bookController.remove);



