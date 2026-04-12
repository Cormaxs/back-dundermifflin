// updatePortadasMultiSource.js
import axios from 'axios';

// --- CONFIGURACIÓN ---
const API_GET_BASE = 'https://api.dunddermifflin.com/books/';
const API_UPDATE_BASE = 'http://localhost:3001/books/';
const DELAY_MS = 600; 
const PAGE_LIMIT = 50;

// --- UTILIDADES DE FUENTES ---

// Fuente A: Google Drive (Solo para PDFs)
function getDriveThumbnail(driveUrl) {
    if (!driveUrl) return null;
    const match = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return match ? `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500` : null;
}

// Fuente B: Google Books API (Para EPUB y otros formatos)
async function getExternalCover(titulo, autor) {
    try {
        const query = encodeURIComponent(`intitle:${titulo}+inauthor:${autor}`);
        const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
        const response = await axios.get(url);
        
        const item = response.data.items?.[0];
        if (item && item.volumeInfo.imageLinks) {
            // Intentamos obtener la versión 'thumbnail', si no existe buscamos alternativas
            return item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
        }
        return null;
    } catch (err) {
        return null;
    }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- LÓGICA DE PROCESAMIENTO ---

async function updateBookPortada(book) {
    const format = book.fileType ? book.fileType.toLowerCase() : '';
    let newPortada = null;

    if (format === 'pdf') {
        // Lógica original para PDFs
        newPortada = getDriveThumbnail(book.link);
        console.log(`🔍 [${book._id}] Buscando en Drive (PDF)...`);
    } else {
        // Lógica externa para EPUB, MOBI, etc.
        console.log(`🌐 [${book._id}] Buscando en Google Books (${format.toUpperCase()})...`);
        newPortada = await getExternalCover(book.titulo, book.autor);
    }

    if (!newPortada) {
        console.log(`⚠️  [${book._id}] No se encontró portada para este título.`);
        return false;
    }

    if (book.portada === newPortada) {
        console.log(`⏭️  [${book._id}] Ya tiene la mejor portada disponible.`);
        return true;
    }

    const payload = {
        titulo: book.titulo,
        portada: newPortada,
        sinopsis: book.sinopsis,
        autor: book.autor,
        categorias: book.categorias,
        link: book.link,
        anio: book.anio || book.year || null,
        fileType: book.fileType,
        idioma: book.idioma || 'Español'
    };

    try {
        const response = await axios.post(`${API_UPDATE_BASE}${book._id}`, payload);
        if (response.status === 200 || response.status === 201) {
            console.log(`✅ [${book._id}] Portada actualizada: ${newPortada}`);
            return true;
        }
        return false;
    } catch (err) {
        console.error(`🔥 [${book._id}] Error al actualizar: ${err.message}`);
        return false;
    }
}

async function processAllBooks() {
    let page = 1;
    let totalPages = 1;
    let stats = { pdf: 0, epub_others: 0, errors: 0 };

    while (page <= totalPages) {
        console.log(`\n📄 --- PAGINA ${page} ---`);
        try {
            const response = await axios.get(`${API_GET_BASE}?page=${page}&limit=${PAGE_LIMIT}`);
            const { data, metadata } = response.data;
            totalPages = metadata.totalPages;

            for (const book of data) {
                const format = book.fileType?.toLowerCase();
                const success = await updateBookPortada(book);
                
                if (success) {
                    if (format === 'pdf') stats.pdf++;
                    else stats.epub_others++;
                } else {
                    stats.errors++;
                }
                
                await delay(DELAY_MS);
            }
            page++;
        } catch (err) {
            console.error("Error obteniendo datos:", err.message);
            break;
        }
    }

    console.log(`\n🏁 RESUMEN FINAL:`);
    console.log(`📁 PDFs (Drive): ${stats.pdf}`);
    console.log(`📚 Otros (Google Books): ${stats.epub_others}`);
    console.log(`❌ Fallidos/Sin cambios: ${stats.errors}`);
}

processAllBooks();