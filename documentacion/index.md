# Documentación del Proyecto Web-Backend

## Descripción General

Este es el backend de la aplicación Dundder Mifflin, una plataforma de libros digitales. El proyecto está construido con Node.js, Express.js y MongoDB, utilizando Mongoose como ODM.

### Tecnologías Utilizadas

- **Node.js**: Entorno de ejecución
- **Express.js**: Framework web
- **MongoDB**: Base de datos NoSQL
- **Mongoose**: ODM para MongoDB
- **JWT**: Autenticación
- **bcryptjs**: Encriptación de contraseñas
- **OpenAI**: Integración con IA (posiblemente para recomendaciones o procesamiento)
- **Axios**: Cliente HTTP
- **CORS**: Manejo de CORS

### Estructura del Proyecto

- `app.js`: Archivo principal de la aplicación
- `controllers/`: Controladores de la API
- `db/`: Conexión a la base de datos
- `middlewares/`: Middlewares personalizados
- `model/`: Modelos de datos (Mongoose schemas)
- `repositories/`: Capa de acceso a datos
- `routes/`: Definición de rutas de la API
- `services/`: Lógica de negocio
- `utils/`: Utilidades (autenticación, etc.)
- `scripts-masivos/`: Scripts para operaciones masivas

### Instalación y Configuración

1. Clona el repositorio
2. Instala las dependencias: `npm install`
3. Configura las variables de entorno en un archivo `.env`
4. Ejecuta el servidor: `npm run dev`

### API Endpoints

La API proporciona endpoints para:

- **Usuarios**: Registro, login, actualización, eliminación
- **Libros**: CRUD completo, búsqueda avanzada
- **Calificaciones**: Calificar libros, ver calificaciones de usuario
- **Peticiones**: Solicitar libros nuevos, gestión administrativa
- **Pagos**: Webhook para procesar pagos (Creem)

Para detalles completos de la API, incluyendo ejemplos de Postman, consulta [api.md](api.md).

### Modelos de Datos

Información detallada sobre los esquemas de datos en [modelos.md](modelos.md).

### Configuración

Instrucciones para configurar el entorno de desarrollo en [configuracion.md](configuracion.md).

### Postman

Guía completa para probar la API con Postman en [postman.md](postman.md).