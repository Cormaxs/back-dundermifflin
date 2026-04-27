import 'dotenv/config'; 
import axios from 'axios';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '8558166827:AAE3yoxSFtooRBQKaBtggrM55v096tkfnPM');
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003777148373';
const MAX_SIZE_BYTES = 19 * 1024 * 1024; // 19MB en bytes

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const syncAllBooksViaApi = async () => {
    let currentPage = 1;
    let totalPages = 1;

    console.log("🚀 Iniciando sincronización masiva con límite de 19MB...");

    do {
        try {
            const { data } = await axios.get(`http://localhost:3001/books/buscadormejorado?page=${currentPage}&limit=12`);
            totalPages = data.metadata.totalPages;

            for (const libro of data.books) {
                if (libro.telegram?.fileId || !libro.link) continue;

                try {
                    const idMatch = libro.link.match(/[-\w]{25,}/); 
                    if (!idMatch) throw new Error("ID de Drive no encontrado");
                    const driveUrl = `https://docs.google.com/uc?export=download&id=${idMatch[0]}`;
                    
                    // 1. Solicitud HEAD para verificar tamaño antes de descargar
                    const headResponse = await axios.head(driveUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    
                    const contentLength = parseInt(headResponse.headers['content-length']);
                    
                    if (contentLength > MAX_SIZE_BYTES) {
                        console.log(`⏩ Saltando: ${libro.titulo} (Peso: ${(contentLength / 1024 / 1024).toFixed(2)} MB)`);
                        continue; // No procesar si es mayor a 19MB
                    }

                    console.log(`⏳ Procesando: ${libro.titulo} (${(contentLength / 1024 / 1024).toFixed(2)} MB)`);
                    
                    // 2. Descarga por stream solo si el tamaño es apto
                    const response = await axios.get(driveUrl, { 
                        responseType: 'stream', 
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });
                    
                    const filename = `${libro.titulo.replace(/[\\/:"*?<>|]/g, '')}.${libro.fileType || 'pdf'}`;
                    const caption = `<b>📖 Título:</b> ${libro.titulo}\n<b>✍️ Autor:</b> ${libro.autor || 'N/A'}\n<b>📅 Año:</b> ${libro.anio || 'N/A'}\n<b>📂 Categorías:</b> ${Array.isArray(libro.categorias) ? libro.categorias.join(', ') : (libro.categorias || 'Sin Categoria')}\n<b>📖 Sinopsis:</b> ${libro.sinopsis || 'Sin sinopsis disponible.'}`;

                    const result = await bot.telegram.sendDocument(CHANNEL_ID, 
                        { source: response.data, filename: filename }, 
                        { caption, parse_mode: 'HTML' }
                    );
                    
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
                    response.data.destroy(); 
                    await sleep(2000); 
                } catch (err) {
                    console.error(`❌ Error en ${libro.titulo}: ${err.message}`);
                }
            }
            console.log(`--- Finalizada página ${currentPage} de ${totalPages} ---`);
            currentPage++;
        } catch (err) {
            console.error("❌ Error al obtener API:", err.message);
            break;
        }
    } while (currentPage <= totalPages);

    console.log("🏁 Proceso completado.");
};

syncAllBooksViaApi().catch(console.error);