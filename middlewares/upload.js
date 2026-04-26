import multer from 'multer';

// Guardamos en memoria para enviar a Telegram inmediatamente sin saturar el disco
const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });