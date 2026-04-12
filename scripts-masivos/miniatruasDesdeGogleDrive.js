// updatePortadas.js
// Ejecutar con: node updatePortadas.js
// Instalar axios primero: npm install axios


import axios from 'axios';

// Configuración
const API_GET_BASE = 'https://api.dunddermifflin.com/books/';
const API_UPDATE_BASE = 'http://localhost:3001/books/';
const DELAY_MS = 500;       // Pausa entre actualizaciones (ms)
const PAGE_LIMIT = 50;      // Libros por página (ajusta según tu API)

// Extraer fileId del link de Google Drive
function extractFileId(driveUrl) {
  if (!driveUrl || typeof driveUrl !== 'string') return null;
  const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Generar URL de miniatura
function getThumbnailUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;
}

// Esperar un tiempo
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Actualizar un solo libro usando POST
async function updateBookPortada(book) {
  const fileId = extractFileId(book.link);
  if (!fileId) {
    console.log(`❌ [${book._id}] No se pudo extraer fileId del link: ${book.link}`);
    return false;
  }

  const newPortada = getThumbnailUrl(fileId);
  
  // Si ya tiene esa miniatura, saltamos
  if (book.portada === newPortada) {
    console.log(`⏭️ [${book._id}] Ya tiene la miniatura correcta.`);
    return true;
  }

  // Preparamos el payload con los datos del libro actualizados
  // (asumiendo que POST espera el objeto completo o al menos los campos necesarios)
  const payload = {
    titulo: book.titulo,
    portada: newPortada,
    sinopsis: book.sinopsis,
    autor: book.autor,
    categorias: book.categorias,
    link: book.link,
    year: book.year || null,        // si no existe, null
    fileType: book.fileType,
    // Si el endpoint requiere otros campos como creator, createdAt, etc., añádelos aquí
  };

  try {
    const response = await axios.post(`${API_UPDATE_BASE}${book._id}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ [${book._id}] Actualizado: ${newPortada}`);
      return true;
    } else {
      console.log(`⚠️ [${book._id}] Respuesta inesperada: ${response.status}`);
      return false;
    }
  } catch (err) {
    console.error(`🔥 [${book._id}] Error: ${err.message}`);
    if (err.response) {
      console.error(`   Status: ${err.response.status} - Data:`, err.response.data);
    }
    return false;
  }
}

// Recorrer todas las páginas
async function processAllBooks() {
  let page = 1;
  let totalPages = 1;
  let updatedCount = 0;
  let errorCount = 0;

  while (page <= totalPages) {
    console.log(`\n📄 Cargando página ${page}...`);
    const url = `${API_GET_BASE}?page=${page}&limit=${PAGE_LIMIT}`;
    
    try {
      const response = await axios.get(url);
      const { data, metadata } = response.data;
      
      if (!data || data.length === 0) break;
      
      totalPages = metadata.totalPages;
      
      for (const book of data) {
        const success = await updateBookPortada(book);
        if (success) updatedCount++;
        else errorCount++;
        
        await delay(DELAY_MS);
      }
      
      page++;
    } catch (err) {
      console.error(`❌ Error al obtener página ${page}: ${err.message}`);
      break;
    }
  }
  
  console.log(`\n🏁 Proceso completado. Actualizados: ${updatedCount}, Errores: ${errorCount}`);
}

// Ejecutar
processAllBooks();