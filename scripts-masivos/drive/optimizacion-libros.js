import axios from 'axios';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import pLimit from 'p-limit';

// --- CONFIGURACIÓN ---
const API_BASE_URL = 'http://localhost:3001/books';
const LIMIT_PER_PAGE = 20; 
const CONCURRENCY_LIMIT = 3; // Bajamos un poco la concurrencia para evitar bloqueos de API

const credentialsPath = path.join(process.cwd(), 'credentials.json');
const tokenPath = path.join(process.cwd(), 'token.json');

const credentials = JSON.parse(fs.readFileSync(credentialsPath)).web;
const token = JSON.parse(fs.readFileSync(tokenPath));

const oAuth2Client = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    credentials.redirect_uris[0]
);
oAuth2Client.setCredentials(token);
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

const limit = pLimit(CONCURRENCY_LIMIT);

/**
 * SANITIZACIÓN DE TÍTULO
 */
const processNameAndMetadata = (name) => {
    if (!name) return { cleanTitle: "Título Desconocido", detectedPages: null };

    const pagesRegex = /(\d+)\s*(?:paginas|páginas|pag|p|pages)\b/i;
    const pagesMatch = name.match(pagesRegex);
    const detectedPages = pagesMatch ? parseInt(pagesMatch[1]) : null;

    let cleanTitle = name
        .replace(/\.[^/.]+$/, "")
        .replace(pagesRegex, "")
        .replace(/[\[\({].*?[\]\)}]/g, "")
        .replace(/[_-]/g, " ")
        .replace(/\./g, " ")
        .replace(/(pdf|epub|mobi|azw3|descargar|completo|full|final|v\d+|spanish|español|english|ingles)/gi, "")
        .replace(/\s+/g, " ")
        .trim();

    cleanTitle = cleanTitle
        .replace(/^[.\s]+|[.\s]+$/g, "")
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());

    return { cleanTitle, detectedPages };
};

/**
 * PROCESAMIENTO POR LIBRO
 */
async function processDriveMetadata(libro) {
    try {
        const idMatch = libro.link.match(/[-\w]{25,}/);
        if (!idMatch) return false;
        const fileId = idMatch[0];

        const driveMeta = await drive.files.get({
            fileId: fileId,
            fields: 'name, description, properties, size, createdTime'
        });

        const { name, description, properties, size, createdTime } = driveMeta.data;
        const { cleanTitle, detectedPages } = processNameAndMetadata(name);

        // --- CONSTRUCCIÓN DEL PAYLOAD SEGÚN TU MODELO ---
        const updatePayload = {
            titulo: cleanTitle,
            fileType: name.split('.').pop().toUpperCase()
        };

        // 1. fileSize: TU MODELO ESPERA UN NÚMERO (Bytes)
        if (size) {
            updatePayload.fileSize = parseInt(size); 
        }

        // 2. paginas: DEBE SER NÚMERO
        const rawPages = detectedPages || (properties && (properties.paginas || properties.pages));
        if (rawPages) {
            const parsedPages = parseInt(rawPages);
            if (!isNaN(parsedPages)) updatePayload.paginas = parsedPages;
        }

        // 3. anio: TU MODELO USA 'anio' (Número)
        if (createdTime) {
            updatePayload.anio = new Date(createdTime).getFullYear();
        }

        // 4. idioma: NORMALIZACIÓN
        const langMatch = name.match(/\[(ESP|ENG|PT|FR|ES|EN)\]/i);
        if (langMatch) {
            const code = langMatch[1].toUpperCase();
            // Mapeamos a lo que tu buscador espera (español / inglés)
            if (code === 'ESP' || code === 'ES') updatePayload.idioma = 'español';
            else if (code === 'ENG' || code === 'EN') updatePayload.idioma = 'inglés';
        } else if (properties && properties.idioma) {
            updatePayload.idioma = properties.idioma.toLowerCase();
        }

        // 5. sinopsis
        if (description) updatePayload.sinopsis = description.trim();

        // Petición a la API
        await axios.post(`${API_BASE_URL}/${libro._id}`, updatePayload);
        
        console.log(`   ✅ OK: ${cleanTitle} (${(size / 1024 / 1024).toFixed(2)} MB)`);
        return true;

    } catch (err) {
        if (err.response) {
            // Esto te dirá si Mongoose rechazó algo por validación (ej: titulo duplicado)
            console.error(`   ❌ Error en ID ${libro._id}:`, err.response.data);
        } else {
            console.error(`   ❌ Error técnico: ${err.message}`);
        }
        return false;
    }
}
/**
 * ORQUESTADOR
 */
const startFullMigration = async () => {
    let currentPage = 1;
    let totalPages = 1;
    let totalProcessed = 0;

    console.log("\n🚀 --- INICIANDO SINCRONIZACIÓN (MODO DEBUG) --- 🚀");

    do {
        try {
            // Verifica que la respuesta de tu API tenga { data: { books: [], metadata: { totalPages: X } } }
            const response = await axios.get(`${API_BASE_URL}/buscadormejorado`, {
                params: { page: currentPage, limit: LIMIT_PER_PAGE }
            });

            // Ajuste según la estructura de tu respuesta (data.books o data.data)
            const currentBooks = response.data.books || response.data.data;
            totalPages = response.data.metadata.totalPages;

            if (!currentBooks || currentBooks.length === 0) {
                console.log("Empty page, finishing...");
                break;
            }

            console.log(`\n📄 Página [${currentPage} / ${totalPages}] | Procesando ${currentBooks.length} libros...`);

            const results = await Promise.all(
                currentBooks.map(libro => limit(() => processDriveMetadata(libro)))
            );

            const successCount = results.filter(r => r === true).length;
            totalProcessed += successCount;

            console.log(`   📊 Página ${currentPage} finalizada: ${successCount} éxitos.`);
            
            currentPage++;

        } catch (error) {
            console.error(`\n❌ Error obteniendo lista de libros:`, error.message);
            break; 
        }

    } while (currentPage <= totalPages);

    console.log(`\n✨ PROCESO FINALIZADO. Total acumulado: ${totalProcessed}\n`);
};

startFullMigration();