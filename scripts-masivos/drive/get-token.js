import fs from 'fs';
import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = 'token.json';

// Cargar credenciales con manejo de errores
const rawData = fs.readFileSync('credentials.json');
const credentials = JSON.parse(rawData);

// Esta parte detecta si el JSON viene como "web" o "installed"
const keys = credentials.web || credentials.installed;

if (!keys) {
    console.error("❌ ERROR: No se encontró la clave 'web' o 'installed' en el JSON.");
    console.log("Contenido actual de tu JSON:", Object.keys(credentials));
    process.exit(1);
}

const { client_id, client_secret, redirect_uris } = keys;

// Usamos la primera URL de redirección disponible
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Fuerza a Google a darte el Refresh Token
});

console.log('🚀 1. Abre este enlace en tu navegador:');
console.log('\x1b[36m%s\x1b[0m', authUrl); // Lo pone en color cian para que se vea mejor

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('🚀 2. Pega el código de la página aquí: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('❌ Error al obtener el token:', err);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
        console.log('✅ ¡Perfecto! El archivo token.json se ha creado con éxito.');
    });
});