# Configuración del Proyecto

## Requisitos Previos

- Node.js (versión 14 o superior)
- MongoDB (local o en la nube)
- npm o yarn

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd web-backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dunddermifflin
JWT_SECRET=tu_jwt_secret_aqui
CREEM_API_KEY=tu_api_key_de_creem
OPENAI_API_KEY=tu_openai_api_key
```

4. Asegúrate de que MongoDB esté corriendo.

5. Ejecuta el servidor en modo desarrollo:
```bash
npm run dev
```

El servidor debería estar corriendo en `http://localhost:3000`.

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3000)
- `MONGODB_URI`: URI de conexión a MongoDB
- `JWT_SECRET`: Secreto para JWT
- `CREEM_API_KEY`: API Key de Creem para pagos
- `OPENAI_API_KEY`: API Key de OpenAI

## Scripts Disponibles

- `npm run dev`: Ejecuta el servidor con nodemon
- `npm test`: Ejecuta los tests (no implementados aún)

## Base de Datos

El proyecto utiliza MongoDB con Mongoose. Los modelos principales son:

- UserDundderMifflin
- BookDundderMifflin
- Rating
- Peticiones
- Subscription

Asegúrate de que la base de datos esté accesible antes de iniciar el servidor.