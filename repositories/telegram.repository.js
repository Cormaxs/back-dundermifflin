import { bot, CHANNEL_ID } from '../services/telegram.service.js'; // Asumiendo que exportas el bot inicializado

export const uploadDocument = async (buffer, filename, caption) => {
    //console.log('Subiendo documento a Telegram:', bot, CHANNEL_ID );
    return await bot.telegram.sendDocument(CHANNEL_ID, 
        { source: buffer, filename: filename }, 
        { caption, parse_mode: 'HTML' }
    );
};

