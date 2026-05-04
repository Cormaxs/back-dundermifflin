import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import { google } from 'googleapis';
import sharp from 'sharp';
import streamifier from 'streamifier';
import pLimit from 'p-limit';
import path from 'path';
import fs from 'fs';

// --- CONFIGURACIÓN ---
cloudinary.config({
    cloud_name: 'dfygwtkcy',
    api_key: '516954329171653',
    api_secret: 'YaJlChNv5Wf8Y1c7H3vgqO0sBF0'
});
// --- CONFIGURACIÓN DRIVE ---
const credentials = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'credentials.json'))).web;
const token = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'token.json')));

const oAuth2Client = new google.auth.OAuth2(credentials.client_id, credentials.client_secret, credentials.redirect_uris[0]);
oAuth2Client.setCredentials(token);
const drive = google.drive({ version: 'v3', auth: oAuth2Client });

const API_BASE_URL = 'http://localhost:3001/books';
const limit = pLimit(3); 

/**
 * Obtiene la miniatura de alta resolución de Drive
 */
async function getDriveThumbnailBuffer(fileId) {
    try {
        const driveFile = await drive.files.get({
            fileId: fileId,
            fields: 'thumbnailLink'
        });

        if (!driveFile.data.thumbnailLink) return null;

        const highResUrl = driveFile.data.thumbnailLink.replace(/=s\d+$/, '=s1000');
        const response = await axios.get(highResUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        return null;
    }
}

/**
 * Procesa el libro siguiendo tus reglas de validación
 */
async function processBook(libro) {
    // --- EVALUACIÓN DE EXCLUSIÓN ---
    // 1. Evita el archivo si ya tiene portadaCloudinary (TU PETICIÓN)
    if (libro.portadaCloudinary && libro.portadaCloudinary.trim() !== "") {
        return; 
    }

    // 2. Omitir si no tiene link de portada origen
    if (!libro.portada) return;

    // 3. Omitir si la portada no es de Google Drive
    if (!libro.portada.includes('drive.google.com')) return;

    const idMatch = libro.portada.match(/id=([-\w]{25,})/);
    if (!idMatch) return;
    const fileId = idMatch[1];

    try {
        console.log(`\n🖼️  Procesando nueva portada: "${libro.titulo}"`);

        const imageBuffer = await getDriveThumbnailBuffer(fileId);
        if (!imageBuffer) {
            console.log(`   ⚠️ Sin miniatura disponible en Drive para: ${libro.titulo}`);
            return;
        }

        const optimizedBuffer = await sharp(imageBuffer)
            .resize(400, 600, { fit: 'cover' })
            .webp({ quality: 65, effort: 6 })
            .toBuffer();

        const cloudinaryUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'portadas_biblioteca',
                    public_id: libro.titulo.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                    format: 'webp'
                },
                (error, result) => {
                    if (result) resolve(result.secure_url);
                    else reject(error);
                }
            );
            streamifier.createReadStream(optimizedBuffer).pipe(uploadStream);
        });

        // Actualizar base de datos
        await axios.post(`${API_BASE_URL}/${libro._id}`, {
            portadaCloudinary: cloudinaryUrl
        });

        console.log(`   ✅ Éxito: Guardado link de Cloudinary.`);

    } catch (error) {
        console.error(`   ❌ Error en "${libro.titulo}":`, error.message);
    }
}

/**
 * Orquestador con Paginación
 */
const startMigration = async () => {
    let page = 1;
    let totalPages = 1;

    console.log("🚀 --- INICIANDO MIGRACIÓN DE PORTADAS (SALTANDO EXISTENTES) --- 🚀");

    do {
        try {
            const { data } = await axios.get(`${API_BASE_URL}/buscadormejorado`, {
                params: { page, limit: 15 }
            });

            totalPages = data.metadata.totalPages;
            console.log(`\n📄 Analizando Página ${page} / ${totalPages}`);

            // Promise.all procesa el lote de la página respetando el pLimit
            await Promise.all(data.books.map(libro => limit(() => processBook(libro))));

            page++;
        } catch (error) {
            console.error("❌ Error en la paginación:", error.message);
            break;
        }
    } while (page <= totalPages);

    console.log("\n🏁 Proceso finalizado. Se han omitido los libros que ya tenían portada.");
};

startMigration();