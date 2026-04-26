import { Router } from 'express';
import * as telegramController from '../controllers/telegram.controller.js';
import { upload } from '../middlewares/upload.js'; // Importamos el middleware


const telegramRoutes = Router();

telegramRoutes.post('/notify', telegramController.handleNotify);
// Endpoint para ver los chats descubiertos
telegramRoutes.get('/channels', telegramController.listChats)
// Usamos el middleware antes del controlador
telegramRoutes.post('/upload', upload.single('file'), telegramController.handleUploadFile);

// Endpoint para reenviar un archivo ya existente en los servidores de Telegram
telegramRoutes.post('/resend', telegramController.handleResendFile);

// Ruta para obtener el link de descarga temporal
telegramRoutes.post('/get-download-link', telegramController.handleGetDownloadLink);





export default telegramRoutes;