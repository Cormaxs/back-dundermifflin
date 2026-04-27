// test-drive.js
import { google } from 'googleapis';
import path from 'path';

const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), 'credentials.json'),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const drive = google.drive({ version: 'v3', auth });

async function testConnection() {
    try {
        console.log("⏳ Verificando conexión con Google Drive...");
        // Esto listará los primeros 5 archivos a los que tiene acceso la cuenta
        const res = await drive.files.list({
            pageSize: 5,
            fields: 'files(id, name)',
        });
        const files = res.data.files;
        if (files.length) {
            console.log("✅ ¡Conexión exitosa! Archivos encontrados:");
            files.map((file) => {
                console.log(`- ${file.name} (${file.id})`);
            });
        } else {
            console.log("⚠️ Conexión exitosa, pero la cuenta no tiene acceso a ningún archivo.");
            console.log("👉 Comparte una carpeta de Drive con el email que aparece en tu credentials.json");
        }
    } catch (err) {
        console.error("❌ Error de autenticación:", err.message);
    }
}

testConnection();