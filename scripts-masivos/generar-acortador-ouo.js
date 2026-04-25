// updateLinksOuo.js
// Ejecutar con: node updateLinksOuo.js

import axios from 'axios';

// Configuración
const API_GET_BASE = 'http://localhost:3001/books/';
const API_UPDATE_BASE = 'http://localhost:3001/books/';
const OUO_API_KEY = '9D3BXW2S';
const DELAY_MS = 1000;      // Aumentado a 1s para evitar límites de la API de Ouo
const PAGE_LIMIT = 50;

// Función para acortar link usando ouo.io
async function shortenUrl(originalUrl) {
  try {
    const encodedUrl = encodeURIComponent(originalUrl);
    const ouoUrl = `http://ouo.io/api/${OUO_API_KEY}?s=${encodedUrl}`;
    const response = await axios.get(ouoUrl);
    return response.data; // Retorna el link acortado como string
  } catch (err) {
    console.error(`  ❌ Error acortando link: ${err.message}`);
    return null;
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function updateBookOuo(book) {
  // Si ya tiene link acortado, saltamos (opcional: quitar si quieres sobrescribir)
  if (book.ouo && book.ouo.includes('ouo.io')) {
    console.log(`⏭️ [${book._id}] Ya tiene link de Ouo.`);
    return true;
  }

  console.log(`🔗 Acortando: ${book.titulo}...`);
  const shortLink = await shortenUrl(book.link);
  
  if (!shortLink) {
    console.log(`❌ [${book._id}] No se pudo obtener link acortado.`);
    return false;
  }

  // Preparamos el payload incluyendo el nuevo campo 'ouo'
  const payload = {
    titulo: book.titulo,
    portada: book.portada,
    sinopsis: book.sinopsis,
    autor: book.autor,
    categorias: book.categorias,
    link: book.link,
    ouo: shortLink, // Campo nuevo
    year: book.year || null,
    fileType: book.fileType,
  };

  try {
    const response = await axios.post(`${API_UPDATE_BASE}${book._id}`, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ [${book._id}] Actualizado con Ouo: ${shortLink}`);
      return true;
    }
  } catch (err) {
    console.error(`🔥 [${book._id}] Error al guardar en DB: ${err.message}`);
    return false;
  }
  return false;
}

async function processAllBooks() {
  let page = 1;
  let totalPages = 1;
  let updatedCount = 0;
  let errorCount = 0;

  while (page <= totalPages) {
    console.log(`\n📄 Procesando página ${page}...`);
    const url = `${API_GET_BASE}?page=${page}&limit=${PAGE_LIMIT}`;
    
    try {
      const response = await axios.get(url);
      const { data, metadata } = response.data;
      
      if (!data || data.length === 0) break;
      
      totalPages = metadata.totalPages;
      
      for (const book of data) {
        const success = await updateBookOuo(book);
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
  
  console.log(`\n🏁 Proceso finalizado. Actualizados: ${updatedCount}, Errores: ${errorCount}`);
}

processAllBooks();