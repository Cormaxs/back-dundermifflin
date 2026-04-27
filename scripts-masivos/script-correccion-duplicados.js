import axios from 'axios';
import { createInterface } from 'readline';

const API_URL = 'https://api.dunddermifflin.com/books';
const BATCH_SIZE = 10; // Número de eliminaciones simultáneas
const ALLOWED_EXTENSIONS = new Set(['PDF', 'EPUB', 'TXT', 'MP4', 'MP3', 'CBR', 'CBZ']);

/**
 * Normaliza strings para comparaciones precisas
 */
const normalize = (str) => (str || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .replace(/\s+/g, ' ');

/**
 * Obtiene todos los libros con paginación optimizada
 */
async function fetchAllBooks() {
  const allBooks = [];
  let page = 1;
  let totalPages = 1;

  try {
    console.log('🔗 Conectando con la API de Dunder Mifflin...');
    do {
      const { data: res } = await axios.get(`${API_URL}?page=${page}&limit=100`);
      allBooks.push(...res.data);
      totalPages = res.metadata.totalPages;
      console.log(`📦 Cargando: ${allBooks.length} libros recuperados...`);
      page++;
    } while (page <= totalPages);

    return allBooks;
  } catch (error) {
    console.error('❌ Error de red:', error.message);
    return [];
  }
}

/**
 * Lógica principal de limpieza
 */
async function cleanLibrary() {
  const books = await fetchAllBooks();
  if (books.length === 0) return;

  const seen = new Map();
  const toDelete = [];
  const reasonStats = { duplicates: 0, invalidFormat: 0 };

  console.log('\n🔍 Analizando biblioteca...');

  for (const book of books) {
    const fileType = (book.fileType || '').toUpperCase();
    const titulo = normalize(book.titulo);
    const autor = normalize(book.autor);
    const key = `${titulo}|${autor}|${fileType}`;

    // 1. Verificar formato permitido
    if (!ALLOWED_EXTENSIONS.has(fileType)) {
      toDelete.push({ ...book, reason: `Formato no permitido (${fileType})` });
      reasonStats.invalidFormat++;
      continue;
    }

    // 2. Verificar duplicados
    if (seen.has(key)) {
      toDelete.push({ ...book, reason: 'Duplicado' });
      reasonStats.duplicates++;
    } else {
      seen.set(key, book._id);
    }
  }

  if (toDelete.length === 0) {
    console.log('✨ ¡Tu biblioteca está impecable! No hay nada que borrar.');
    return;
  }

  // Resumen del caos
  console.table(toDelete.map(b => ({
    Titulo: b.titulo,
    Tipo: b.fileType,
    Motivo: b.reason
  })));

  console.log(`\n📊 Resumen: ${reasonStats.duplicates} duplicados y ${reasonStats.invalidFormat} formatos inválidos.`);
  
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await new Promise(res => {
    rl.question(`⚠️  ¿Proceder a eliminar ${toDelete.length} elementos? (S/N): `, a => {
      rl.close();
      res(a.toLowerCase() === 's');
    });
  });

  if (!confirm) return console.log('🚫 Operación cancelada.');

  // Eliminación por lotes para máxima velocidad
  console.log(`\n🔪 Iniciando purga en lotes de ${BATCH_SIZE}...`);
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (item) => {
      try {
        await axios.delete(`${API_URL}/${item._id}`);
        console.log(`🗑️  Eliminado [${item.reason}]: ${item.titulo}`);
      } catch (e) {
        console.error(`❌ Error con ${item._id}: ${e.message}`);
      }
    }));
  }

  console.log('\n✅ Limpieza masiva completada.');
}

cleanLibrary();