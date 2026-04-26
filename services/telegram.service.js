import { Telegraf } from 'telegraf';
import * as telegramRepository from '../repositories/telegram.repository.js';


export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN /*|| '8558166827:AAE3yoxSFtooRBQKaBtggrM55v096tkfnPM'*/);
export const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID /*|| '-1003777148373'*/;

// Inicialización del Bot
bot.launch().then(() => console.log('Bot de Telegram iniciado.'));

// Helper para centralizar errores
const handleTelegramError = (error, context) => {
    console.error(`Error en ${context}:`, error.message);
    throw new Error(`Telegram Service: ${error.message}`);
};

export const sendNotification = async (message) => {
    try {
        return await bot.telegram.sendMessage(CHANNEL_ID, message);
    } catch (e) { handleTelegramError(e, 'sendNotification'); }
};

export const sendDocument = async (source, fileName, caption = "") => {
    try {
        return await bot.telegram.sendDocument(CHANNEL_ID, 
            { source, filename: fileName }, 
            { caption }
        );
    } catch (e) { handleTelegramError(e, 'sendDocument'); }
};

export const resendFileById = async (fileId, chatId) => {
    try {
        return await bot.telegram.sendDocument(chatId, fileId);
    } catch (e) { handleTelegramError(e, 'resendFileById'); }
};

export const getDownloadUrl = async (fileId) => {
    try {
        const file = await bot.telegram.getFile(fileId);
        return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    } catch (e) { handleTelegramError(e, 'getDownloadUrl'); }
};





export const processAndUpload = async (file, bookData) => {
    const caption = `<b>📖 Título:</b> ${bookData.titulo}
    \n<b>✍️ Autor:</b> ${bookData.autor}
    \n<b>📅 Año:</b> ${bookData.anio} 
     \n<b>📂 Categorías:</b> ${bookData.categorias}
    \n<b>📖 Sinopsis:</b> ${bookData.sinopsis}
   `;
    
    // Llamamos al repository
    return await telegramRepository.uploadDocument(file.buffer, file.originalname, caption);
};