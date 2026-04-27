import 'dotenv/config';
import axios from 'axios';
import { Telegraf } from 'telegraf';
import pLimit from 'p-limit';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

// --- CONFIGURACIÓN DE TELEGRAM ---
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '8558166827:AAE3yoxSFtooRBQKaBtggrM55v096tkfnPM');
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003777148373';
const MAX_SIZE_BYTES = 49 * 1024 * 1024; // 49MB

// --- CONFIGURACIÓN DE GOOGLE DRIVE (TU CUENTA) ---
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

// --- CONTROL DE CONCURRENCIA ---
const limit = pLimit(3); // 3 subidas simultáneas

export const syncAllBooksViaApi = async () => {
    let currentPage = 1;
    let totalPages = 1;

    console.log("🚀 Iniciando sincronización masiva usando Cuenta Personal de Drive...");

    do {
        try {
            const { data } = await axios.get(`http://localhost:3001/books/buscadormejorado?page=${currentPage}&limit=15`);
            totalPages = data.metadata.totalPages;

            // Filtramos los que no tienen fileId en Telegram y tienen link
            const tareas = data.books
                .filter(libro => !libro.telegram?.fileId && libro.link)
                .map(libro => limit(() => procesarLibro(libro)));

            await Promise.all(tareas);

            console.log(`\n📦 --- Finalizada página ${currentPage} de ${totalPages} --- \n`);
            currentPage++;
        } catch (err) {
            console.error("❌ Error en página:", err.message);
            break;
        }
    } while (currentPage <= totalPages);

    console.log("🏁 Proceso masivo completado.");
};

async function procesarLibro(libro) {
    try {
        const idMatch = libro.link.match(/[-\w]{25,}/);
        if (!idMatch) return;
        const fileId = idMatch[0];

        // 1. Obtener metadatos con la API de Google (Tus permisos)
        const metadata = await drive.files.get({
            fileId: fileId,
            fields: 'size, name'
        });
        
        const contentLength = parseInt(metadata.data.size || 0);

        if (contentLength === 0 || contentLength > MAX_SIZE_BYTES) {
            console.log(`⏩ Saltando por peso (${(contentLength / 1024 / 1024).toFixed(2)} MB): ${libro.titulo}`);
            return;
        }

        // 2. Descarga por Stream oficial de Google (Eficiente y Bypass de seguridad)
        const response = await drive.files.get(
            { fileId: fileId, alt: 'media' },
            { responseType: 'stream' }
        );
        
        const extension = libro.fileType || metadata.data.name.split('.').pop() || 'pdf';
        const filename = `${libro.titulo.replace(/[\\/:"*?<>|]/g, '')}.${extension}`;

        // 3. Formato de mensaje detallado
        const categoriasStr = Array.isArray(libro.categorias) ? libro.categorias.join(', ') : (libro.categorias || 'Sin Categoría');
        
        const caption = [
            `<b>📖 Título:</b> ${libro.titulo}`,
            `<b>✍️ Autor:</b> ${libro.autor || 'N/A'}`,
            `<b>📅 Año:</b> ${libro.anio || 'N/A'}`,
            `<b>📂 Categorías:</b> ${categoriasStr}`,
            `\n<b>📖 Sinopsis:</b> <i>${(libro.sinopsis || 'Sin sinopsis.').substring(0, 600)}...</i>`
        ].join('\n');

        // 4. Envío a Telegram (Stream directo)
        const result = await bot.telegram.sendDocument(CHANNEL_ID, 
            { source: response.data, filename: filename }, 
            { 
                caption: caption.substring(0, 1024), 
                parse_mode: 'HTML' 
            }
        );

        // 5. Actualizar DB Local
        await axios.post(`http://localhost:3001/books/${libro._id}`, {
            ...libro,
            telegram: {
                fileId: result.document.file_id,
                fileUniqueId: result.document.file_unique_id,
                mimeType: result.document.mime_type,
                fileSize: result.document.file_size,
                isAvailable: true
            }
        });

        console.log(`✅ Sincronizado: ${libro.titulo}`);

    } catch (err) {
        if (err.code === 403) {
            console.error(`❌ Error 403 en ${libro.titulo}: Tu cuenta no tiene acceso a este archivo.`);
        } else {
            console.error(`❌ Error en ${libro.titulo}: ${err.message}`);
        }
    }
}

// Iniciar el proceso
syncAllBooksViaApi().catch(console.error);