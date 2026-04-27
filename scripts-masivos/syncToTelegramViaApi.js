import 'dotenv/config'; 
import axios from 'axios';
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '8558166827:AAE3yoxSFtooRBQKaBtggrM55v096tkfnPM');
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '-1003777148373';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Función para subir a Telegram
const uploadToTelegram = async (buffer, bookData, filename) => {
    const caption = `<b>📖 Título:</b> ${bookData.titulo}
\n<b>✍️ Autor:</b> ${bookData.autor}
\n<b>📅 Año:</b> ${bookData.anio || 'N/A'} 
\n<b>📂 Categorías:</b> ${Array.isArray(bookData.categorias) ? bookData.categorias.join(', ') : bookData.categorias}
\n<b>📖 Sinopsis:</b> ${bookData.sinopsis || 'Sin sinopsis disponible.'}`;

    return await bot.telegram.sendDocument(CHANNEL_ID, 
        { source: Buffer.from(buffer), filename: filename }, 
        { caption, parse_mode: 'HTML' }
    );
};

export const syncAllBooksViaApi = async () => {
    let currentPage = 1;
    let totalPages = 1;

    console.log("🚀 Iniciando sincronización masiva...");

    do {
        try {
            const { data } = await axios.get(`http://localhost:3000/books/buscadormejorado?page=${currentPage}&limit=12`);
            totalPages = data.metadata.totalPages;

            for (const libro of data.books) {
                if (libro.telegram?.fileId || !libro.link) continue;

                try {
                    console.log(`⏳ Procesando: ${libro.titulo}`);
                    
                    // EXTRACCIÓN DE ID Y DESCARGA CORREGIDA
                    const idMatch = libro.link.match(/[-\w]{25,}/); 
                    if (!idMatch) throw new Error("No se pudo extraer el ID del link");
                    
                    const driveUrl = `https://docs.google.com/uc?export=download&id=${idMatch[0]}`;
                    
                    const response = await axios.get(driveUrl, { 
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });
                    
                    const filename = `${libro.titulo.replace(/[\\/:"*?<>|]/g, '')}.${libro.fileType || 'pdf'}`;
                    const result = await uploadToTelegram(response.data, libro, filename);
                    
                    await axios.post(`http://localhost:3000/books/${libro._id}`, {
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

// Ejecutar
syncAllBooksViaApi().catch(console.error);