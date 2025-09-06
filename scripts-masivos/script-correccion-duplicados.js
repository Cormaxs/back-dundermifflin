/**
 * Script para identificar y eliminar libros duplicados en la API de Dunder Mifflin.
 * Los duplicados se definen como documentos con el mismo título, autor y tipo de archivo.
 * Se conserva la primera instancia encontrada y se eliminan las subsiguientes.
 */

// Importación moderna de los módulos de Node.js
import { createInterface } from 'readline';

// URL base de la API de Dunder Mifflin
const API_URL = 'https://api.dunddermifflin.com/books';

/**
 * Función para obtener todos los libros de la API, manejando la paginación.
 * @returns {Promise<Array>} Un array de objetos de libros o un array vacío si falla.
 */
async function fetchAllBooks() {
  const allBooks = [];
  let currentPage = 1;
  let totalBooksFetched = 0;
  let totalCount = 0;
  const limit = 10; // La API devuelve 10 libros por página

  try {
    console.log('🔗 Obteniendo todos los libros de la base de datos (con paginación)...');

    // Usamos un bucle while para seguir pidiendo páginas hasta obtener todos los libros
    do {
      const response = await fetch(`${API_URL}?page=${currentPage}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      const booksInPage = result.data;
      totalCount = result.meta.totalCount;

      // Verificación para asegurarnos de que el resultado es un array
      if (!Array.isArray(booksInPage)) {
        console.error('❌ Error: La propiedad "data" en la respuesta de la API no es un array.');
        return [];
      }

      // Agregamos los libros de la página actual a nuestro array principal
      allBooks.push(...booksInPage);
      totalBooksFetched = allBooks.length;
      console.log(`Página ${currentPage} obtenida. Libros recuperados: ${totalBooksFetched}/${totalCount}`);

      currentPage++;

    } while (totalBooksFetched < totalCount);

    console.log(`✅ ¡Éxito! Se obtuvieron los ${totalCount} libros en total.`);
    return allBooks;
  } catch (error) {
    console.error('❌ Error al obtener los libros. Por favor, verifica que la URL de la API es correcta y que el servidor está en funcionamiento:', error.message);
    return [];
  }
}

/**
 * Función para eliminar un libro por su ID.
 * @param {string} bookId - El ID del libro a eliminar.
 * @returns {Promise<boolean>} Devuelve true si la eliminación fue exitosa.
 */
async function deleteBookById(bookId) {
  const url = `${API_URL}/${bookId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    console.log(`🗑️ Libro con ID ${bookId} eliminado con éxito.`);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar el libro con ID ${bookId}:`, error.message);
    return false;
  }
}

/**
 * Función principal para encontrar y eliminar duplicados.
 */
async function findAndRemoveDuplicates() {
  const books = await fetchAllBooks();
  
  if (books.length === 0) {
      console.log('No hay libros para procesar. Finalizando script.');
      return;
  }

  const seenBooks = new Map();
  const duplicatesToDelete = [];

  console.log('\n🔍 Identificando libros duplicados...');

  for (const book of books) {
    // Definimos una clave única basada en el título, autor y tipo de archivo
    const key = `${book.titulo}-${book.autor}-${book.fileType}`.toLowerCase().trim();

    if (seenBooks.has(key)) {
      duplicatesToDelete.push(book);
    } else {
      seenBooks.set(key, book);
    }
  }

  if (duplicatesToDelete.length === 0) {
    console.log('✨ No se encontraron libros duplicados. ¡La base de datos está limpia!');
    return;
  }

  console.log(`\n🚨 Se encontraron ${duplicatesToDelete.length} libros duplicados.`);
  console.log('A continuación se muestra la lista de libros que serán eliminados:');
  duplicatesToDelete.forEach((book, index) => {
    console.log(`  ${index + 1}. Título: "${book.titulo}", Autor: "${book.autor}", ID: ${book._id}`);
  });
  
  // Confirma con el usuario antes de proceder
  const confirmDeletion = await new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('\n¿Estás seguro de que deseas eliminar estos libros duplicados? (S/N): ', answer => {
      rl.close();
      resolve(answer.toLowerCase() === 's');
    });
  });

  if (!confirmDeletion) {
    console.log('\n🚫 La eliminación ha sido cancelada.');
    return;
  }

  console.log('\n🔪 Eliminando duplicados...');
  let deletedCount = 0;
  for (const duplicate of duplicatesToDelete) {
    const isDeleted = await deleteBookById(duplicate._id);
    if (isDeleted) {
      deletedCount++;
    }
  }

  console.log(`\n✅ Proceso completado. Se eliminaron ${deletedCount} de ${duplicatesToDelete.length} duplicados.`);
}

// Iniciar el proceso
findAndRemoveDuplicates();