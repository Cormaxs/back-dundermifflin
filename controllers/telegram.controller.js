import * as telegramService from '../services/telegram.service.js';
import * as bookService from '../services/book.service.js';

// Helper para respuestas estandarizadas
const sendResponse = (res, success, data = {}, status = 200) => {
    res.status(status).json({ success, ...data });
};


export const handleNotify = async (req, res) => {
    try {
        const { message } = req.body;
        await telegramService.sendNotification(message);
        sendResponse(res, true, { message: 'Enviado correctamente' });
    } catch (error) {
        sendResponse(res, false, { error: error.message }, 500);
    }
};

export const listChats = (req, res) => {
    try {
        const chats = telegramService.getKnownChats();
        sendResponse(res, true, { chats });
    } catch (error) {
        sendResponse(res, false, { error: error.message }, 500);
    }
};

export const handleUploadFile = async (req, res) => {
    try {
        const { titulo, autor, sinopsis, categorias, link, anio, paginas } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ success: false, message: 'Archivo requerido' });

        // 1. Subir a Telegram (vía service)
        const telegramRes = await telegramService.processAndUpload(file, req.body);

        // 2. Guardar en MongoDB (vía tu book.service existente)
        const bookPayload = {
            ...req.body,
            telegram: {
                fileId: telegramRes.document.file_id,
                fileUniqueId: telegramRes.document.file_unique_id,
                mimeType: telegramRes.document.mime_type,
                fileSize: telegramRes.document.file_size,
                isAvailable: true
            }
        };

        const libroGuardado = await bookService.createBook(bookPayload);

        res.status(200).json({ 
            success: true, 
            message: 'Libro procesado exitosamente', 
            libro: libroGuardado 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
export const handleResendFile = async (req, res) => {
    try {
        const { fileId, chatId } = req.body;
        if (!fileId || !chatId) return sendResponse(res, false, { message: 'Datos incompletos' }, 400);

        const result = await telegramService.resendFileById(fileId, chatId);
        sendResponse(res, true, { result });
    } catch (error) {
        sendResponse(res, false, { error: error.message }, 500);
    }
};

export const handleGetDownloadLink = async (req, res) => {
    try {
        const { fileId } = req.body;
        console.log("Solicitud de link de descarga para fileId:", fileId);
        if (!fileId) return sendResponse(res, false, { message: 'fileId requerido' }, 400);

        const url = await telegramService.getDownloadUrl(fileId);
        console.log("URL de descarga obtenida:", url);
        sendResponse(res, true, { url });
    } catch (error) {
        sendResponse(res, false, { error: error.message }, 500);
    }
};