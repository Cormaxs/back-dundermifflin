import axios from 'axios';
import readline from 'readline';

/** --- CONFIGURACIÓN --- **/
const API_ENDPOINT = 'http://localhost:3001/books/';
const USER_ID = '68af7730a043f5bcd5cae2e5';
const BATCH_SIZE = 10; // Cantidad de libros subiéndose simultáneamente
const DELAY_BETWEEN_BATCHES = 100; // Milisegundos de respiro

/** --- UTILIDADES --- **/
const sanitize = (str) => str ? str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim() : "";
const extractFileId = (url) => url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1] || null;
const getDriveThumbnail = (fileId) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w500`;

function renderUI(current, total, status = 'Subiendo...') {
    const percent = Math.round((current / total) * 100);
    const dots = ".".repeat(current % 4);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`📊 [${percent}%] | ${current}/${total} | ${status}${dots}   `);
}

/** --- PROCESO --- **/
async function processBook(line) {
    const regex = /(.*?)(?:autor\s(.*))?\s(https:\/\/.*)/;
    const match = line.match(regex);
    if (!match) return null;

    let [_, rawTitle, manualAuthor, link] = match;
    const driveId = extractFileId(link);
    const cleanTitle = sanitize(rawTitle.replace(/\.[^/.]+$/, "").replace(/[-_.]/g, ' '));

    // Armamos el objeto base (sin esperar a APIs externas para máxima velocidad)
    const bookData = {
        titulo: cleanTitle,
        portada: driveId ? getDriveThumbnail(driveId) : 'https://placehold.co/600x400?text=Sin+Portada',
        sinopsis: 'Pendiente de sincronización...',
        autor: sanitize(manualAuthor) || 'Autor Desconocido',
        link: link.trim(),
        fileType: rawTitle.split('.').pop().toUpperCase(),
        creator: USER_ID
    };

    try {
        // Subida directa
        await axios.post(API_ENDPOINT, bookData, { timeout: 10000 });
        return true;
    } catch (e) {
        // Si falla el lote, es probable que sea por un campo específico
        return false;
    }
}

async function fastUpload(dataString) {
    const lines = dataString.split('\n').filter(l => l.trim().length > 10);
    const total = lines.length;
    let completed = 0;
    let errors = 0;

    console.log(`\n🚀 Iniciando transferencia rápida (${total} archivos)\n`);

    // Procesamos por grupos (Batches)
    for (let i = 0; i < total; i += BATCH_SIZE) {
        const currentBatch = lines.slice(i, i + BATCH_SIZE);
        
        // Ejecutamos el grupo en paralelo
        const results = await Promise.all(currentBatch.map(line => processBook(line)));
        
        completed += results.filter(r => r === true).length;
        errors += results.filter(r => r === false).length;

        renderUI(completed + errors, total);
        
        // Pequeña pausa para que el event loop respire y el backend procese
        if (DELAY_BETWEEN_BATCHES > 0) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
        }
    }

    console.log(`\n\n✅ Finalizado: ${completed} subidos | ❌ Errores: ${errors}`);
}

// --- EJECUCIÓN ---
const bookDataString = `El Gran Gatsby autor F. Scott Fitzgerald https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view?usp=sharing`;

fastUpload(bookDataString);