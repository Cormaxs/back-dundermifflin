/**
 * Script para enriquecer los metadatos de los libros existentes en la base de datos de Dunder Mifflin.
 * Busca datos más precisos (título, autor, sinopsis, portada) usando APIs externas.
 */

// Importación moderna de los módulos de Node.js
import { createInterface } from 'readline';

// URLs de la API y el endpoint para editar
const API_URL = 'https://api.dunddermifflin.com/books';

/**
 * Realiza una búsqueda en la API de Google Books para obtener metadatos.
 * @param {string} query - El término de búsqueda (ej. título del documento).
 * @returns {object|null} Un objeto con los metadatos, o null si no se encuentra.
 */
async function searchGoogleBooks(query) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const item = data.items[0].volumeInfo;
      const resultTitle = item.title ? item.title.toLowerCase() : '';
      const queryLower = query.toLowerCase();

      if (resultTitle.includes(queryLower) || queryLower.includes(resultTitle)) {
        const portada = item.imageLinks?.large || item.imageLinks?.thumbnail || null;
        return {
          titulo: item.title || 'Título Desconocido',
          portada: portada,
          sinopsis: item.description || 'Sin sinopsis disponible.',
          autor: item.authors?.join(', ') || 'Autor Desconocido',
          categorias: item.categories || ['Sin Categoria'],
        };
      }
    }
  } catch (error) {
    console.error("Error al buscar en la API de Google Books:", error);
  }
  return null;
}

/**
 * Realiza una búsqueda en la API de Open Library para obtener metadatos.
 * @param {string} query - El término de búsqueda (ej. título del documento).
 * @returns {object|null} Un objeto con los metadatos, o null si no se encuentra.
 */
async function searchOpenLibrary(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.docs && data.docs.length > 0) {
      const item = data.docs[0];
      const resultTitle = item.title ? item.title.toLowerCase() : '';
      const queryLower = query.toLowerCase();

      if (resultTitle.includes(queryLower) || queryLower.includes(resultTitle)) {
        const portada = item.cover_i ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg` : null;
        return {
          titulo: item.title || 'Título Desconocido',
          portada: portada,
          sinopsis: item.subtitle || 'Sin sinopsis disponible.',
          autor: item.author_name?.join(', ') || 'Autor Desconocido',
          categorias: item.subject || ['Sin Categoria'],
        };
      }
    }
  } catch (error) {
    console.error("Error al buscar en la API de Open Library:", error);
  }
  return null;
}

/**
 * Realiza una búsqueda en la API de Comic Vine para obtener metadatos y portadas de cómics.
 * @param {string} query - El término de búsqueda (ej. título del cómic).
 * @returns {object|null} Un objeto con los metadatos, o null si no se encuentra.
 */
async function searchComicVine(query) {
  const apiKey = '0d2315bb7ad0378ede3a4004b2bc34976c9f06f8';
  const url = `https://comicvine.gamespot.com/api/search/?api_key=${apiKey}&format=json&resources=issue&query=${encodeURIComponent(query)}`;
  
  try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const portada = item.image?.original_url || null;
        
        return {
          titulo: item.volume?.name || 'Título Desconocido',
          portada: portada,
          sinopsis: item.description || 'Sin sinopsis disponible.',
          autor: 'Autor Desconocido',
          categorias: ['Cómic', item.volume?.publisher?.name].filter(Boolean),
        };
      }
  } catch (error) {
      console.error("Error al buscar en la API de Comic Vine:", error);
  }
  return null;
}

// --- NUEVAS FUNCIONES DE BÚSQUEDA ---

/**
 * Realiza una búsqueda en la API de Internet Archive.
 * @param {string} query - El término de búsqueda (título del libro).
 * @returns {object|null} Un objeto con metadatos.
 */
async function searchInternetArchive(query) {
  const url = `https://archive.org/advancedsearch.php?q=title%3A%28${encodeURIComponent(query)}%29&output=json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.response?.docs?.length > 0) {
      const item = data.response.docs[0];
      const resultTitle = item.title ? item.title.toLowerCase() : '';
      const queryLower = query.toLowerCase();

      if (resultTitle.includes(queryLower) || queryLower.includes(resultTitle)) {
        const portada = item.image || `https://archive.org/services/get-identifier-image.php?identifier=${item.identifier}`;
        return {
          titulo: item.title || 'Título Desconocido',
          portada: portada,
          sinopsis: item.description || 'Sin sinopsis disponible.',
          autor: item.creator || 'Autor Desconocido',
          categorias: item.subject || ['Sin Categoria'],
        };
      }
    }
  } catch (error) {
    console.error("Error al buscar en la API de Internet Archive:", error);
  }
  return null;
}

/**
 * Realiza una búsqueda en la API de la Biblioteca del Congreso.
 * @param {string} query - El término de búsqueda (título del libro).
 * @returns {object|null} Un objeto con metadatos.
 */
async function searchLibraryOfCongress(query) {
  const url = `https://www.loc.gov/books/?q=${encodeURIComponent(query)}&fo=json`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.content?.results?.length > 0) {
      const item = data.content.results[0];
      const resultTitle = item.title?.toLowerCase() || '';
      const queryLower = query.toLowerCase();

      if (resultTitle.includes(queryLower) || queryLower.includes(resultTitle)) {
        return {
          titulo: item.title || 'Título Desconocido',
          portada: item.image_url || null,
          sinopsis: item.description || 'Sin sinopsis disponible.',
          autor: item.contributor?.join(', ') || 'Autor Desconocido',
          categorias: item.subjects || ['Sin Categoria'],
        };
      }
    }
  } catch (error) {
    console.error("Error al buscar en la API de la Biblioteca del Congreso:", error);
  }
  return null;
}

// --- FUNCIONES EXISTENTES (SIN CAMBIOS) ---

async function fetchAllBooks() {
  const allBooks = [];
  let currentPage = 1;
  let totalBooksFetched = 0;
  let totalCount = 0;
  const limit = 10; 

  try {
    console.log('🔗 Obteniendo todos los libros de la base de datos (con paginación)...');
    do {
      const response = await fetch(`${API_URL}?page=${currentPage}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      const result = await response.json();
      const booksInPage = result.data;
      totalCount = result.meta.totalCount;
      if (!Array.isArray(booksInPage)) {
        console.error('❌ Error: La propiedad "data" en la respuesta de la API no es un array.');
        return [];
      }
      allBooks.push(...booksInPage);
      totalBooksFetched = allBooks.length;
      console.log(`Página ${currentPage} obtenida. Libros recuperados: ${totalBooksFetched}/${totalCount}`);
      currentPage++;
    } while (totalBooksFetched < totalCount);

    console.log(`✅ ¡Éxito! Se obtuvieron los ${totalCount} libros en total.`);
    return allBooks;
  } catch (error) {
    console.error('❌ Error al obtener los libros:', error.message);
    return [];
  }
}

async function updateBook(bookId, updatedData) {
  const url = `${API_URL}/${bookId}`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    });
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    console.log(`✨ Libro con ID ${bookId} actualizado con éxito.`);
    return true;
  } catch (error) {
    console.error(`❌ Error al actualizar el libro con ID ${bookId}:`, error.message);
    return false;
  }
}

// --- FUNCIÓN PRINCIPAL MEJORADA CON NUEVAS APIS ---

async function enrichExistingBooks() {
  const books = await fetchAllBooks();
  if (books.length === 0) {
    console.log('No hay libros para procesar. Finalizando script.');
    return;
  }

  const confirmEnrichment = await new Promise(resolve => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question(`\nSe encontraron ${books.length} libros. ¿Deseas intentar enriquecer sus datos? (S/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 's');
    });
  });

  if (!confirmEnrichment) {
    console.log('🚫 Proceso de enriquecimiento cancelado.');
    return;
  }

  let updatedCount = 0;
  for (const book of books) {
    const isComic = book.fileType?.toUpperCase() === 'CBR' || book.fileType?.toUpperCase() === 'CBZ';
    let enrichedData = null;

    // Lógica de búsqueda en cascada
    if (isComic) {
      enrichedData = await searchComicVine(book.titulo);
    }
    
    if (!enrichedData) {
      enrichedData = await searchGoogleBooks(book.titulo);
    }

    if (!enrichedData) {
      enrichedData = await searchOpenLibrary(book.titulo);
    }

    // --- Nuevas búsquedas ---
    if (!enrichedData) {
      enrichedData = await searchInternetArchive(book.titulo);
    }

    if (!enrichedData) {
      enrichedData = await searchLibraryOfCongress(book.titulo);
    }

    if (enrichedData) {
      const isTitleImproved = enrichedData.titulo && enrichedData.titulo !== 'Título Desconocido' && enrichedData.titulo !== book.titulo;
      const isAuthorImproved = enrichedData.autor && enrichedData.autor !== 'Autor Desconocido' && enrichedData.autor !== book.autor;
      const isSynopsisImproved = enrichedData.sinopsis && enrichedData.sinopsis !== 'Sin sinopsis disponible.' && enrichedData.sinopsis !== book.sinopsis;
      const isCoverImproved = enrichedData.portada && enrichedData.portada !== 'https://placehold.co/600x400/000000/FFFFFF?text=Sin+Portada' && enrichedData.portada !== book.portada;

      if (isTitleImproved || isAuthorImproved || isSynopsisImproved || isCoverImproved) {
        console.log(`\n🔍 Encontrados datos mejorados para: "${book.titulo}"`);
        const updatedFields = {
          titulo: isTitleImproved ? enrichedData.titulo : book.titulo,
          autor: isAuthorImproved ? enrichedData.autor : book.autor,
          sinopsis: isSynopsisImproved ? enrichedData.sinopsis : book.sinopsis,
          portada: isCoverImproved ? enrichedData.portada : book.portada,
          categorias: enrichedData.categorias
        };
        const success = await updateBook(book._id, updatedFields);
        if (success) {
          updatedCount++;
        }
      }
    }
  }

  console.log(`\n✅ Proceso de enriquecimiento completado. Se actualizaron ${updatedCount} de ${books.length} libros.`);
}

// Iniciar el proceso
enrichExistingBooks();