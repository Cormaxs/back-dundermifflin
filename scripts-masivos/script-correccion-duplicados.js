/**
 * Script para identificar y eliminar libros duplicados en la API de Dunder Mifflin.
 * Los duplicados se definen como documentos con el mismo título, autor y tipo de archivo.
 * Se conserva la primera instancia encontrada y se eliminan las subsiguientes.
 */

import { createInterface } from 'readline';

const API_URL = 'https://api.dunddermifflin.com/books';

/**
 * Obtiene todos los libros manejando la paginación correctamente.
 * @returns {Promise<Array>}
 */
async function fetchAllBooks() {
  const allBooks = [];
  let currentPage = 1;
  const limit = 50; // Mayor eficiencia (cambia según lo que soporte tu API)
  let totalPages = 1;

  try {
    console.log('🔗 Obteniendo todos los libros...');

    // Primera petición para conocer el total de páginas
    const firstRes = await fetch(`${API_URL}?page=1&limit=${limit}`);
    if (!firstRes.ok) throw new Error(`HTTP ${firstRes.status}`);
    const firstData = await firstRes.json();
    totalPages = firstData.metadata.totalPages;
    allBooks.push(...firstData.data);
    console.log(`Página 1/${totalPages} obtenida (${firstData.data.length} libros).`);

    // Resto de páginas
    for (let page = 2; page <= totalPages; page++) {
      const res = await fetch(`${API_URL}?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      allBooks.push(...data.data);
      console.log(`Página ${page}/${totalPages} obtenida (${data.data.length} libros). Total: ${allBooks.length}`);
    }

    console.log(`✅ Se obtuvieron ${allBooks.length} libros en total.`);
    return allBooks;
  } catch (error) {
    console.error('❌ Error al obtener libros:', error.message);
    return [];
  }
}

/**
 * Elimina un libro por su ID.
 * @param {string} bookId
 * @returns {Promise<boolean>}
 */
async function deleteBookById(bookId) {
  try {
    const res = await fetch(`${API_URL}/${bookId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log(`🗑️ Eliminado: ${bookId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error al eliminar ${bookId}:`, error.message);
    return false;
  }
}

/**
 * Normaliza un string para comparación (elimina acentos, espacios extra, minúsculas)
 */
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')                 // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .trim()
    .replace(/\s+/g, ' ');           // Espacios múltiples a uno solo
}

/**
 * Encuentra y elimina duplicados.
 */
async function findAndRemoveDuplicates() {
  const books = await fetchAllBooks();
  if (books.length === 0) return;

  const seen = new Map();       // clave -> primer libro encontrado
  const duplicates = [];

  console.log('\n🔍 Identificando duplicados...');

  for (const book of books) {
    // Asegurar que los campos existan
    const titulo = normalize(book.titulo || '');
    const autor = normalize(book.autor || '');
    const fileType = normalize(book.fileType || '');

    const key = `${titulo}|${autor}|${fileType}`;

    if (seen.has(key)) {
      duplicates.push(book);
    } else {
      seen.set(key, book);
    }
  }

  if (duplicates.length === 0) {
    console.log('✨ No se encontraron duplicados.');
    return;
  }

  console.log(`\n🚨 Se encontraron ${duplicates.length} duplicados:`);
  duplicates.forEach((d, i) => {
    console.log(`  ${i+1}. "${d.titulo}" | ${d.autor} | ${d.fileType} (ID: ${d._id})`);
  });

  // Confirmación interactiva
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise(resolve => {
    rl.question('\n¿Eliminar estos duplicados? (S/N): ', ans => {
      rl.close();
      resolve(ans.toLowerCase() === 's');
    });
  });

  if (!confirm) {
    console.log('🚫 Cancelado.');
    return;
  }

  console.log('\n🔪 Eliminando...');
  let deleted = 0;
  for (const dup of duplicates) {
    if (await deleteBookById(dup._id)) deleted++;
  }
  console.log(`\n✅ Eliminados ${deleted} de ${duplicates.length}.`);
}

findAndRemoveDuplicates();