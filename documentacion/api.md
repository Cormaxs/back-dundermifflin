# API Documentation

## Base URL
```
http://localhost:3000
```

## Autenticación
La mayoría de los endpoints requieren autenticación JWT. Incluye el token en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### Usuarios

#### Registro de Usuario
**POST** `/users/register`

**Request Body:**
```json
{
  "username": "usuario123",
  "password": "password123",
  "email": "usuario@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "user": {
    "username": "usuario123",
    "email": "usuario@example.com",
    "role": "user",
    "planType": "free",
    "isSubscribed": false,
    "favoritos": [],
    "subscriptionStatus": "none"
  }
}
```

**Postman Example:**
- Method: POST
- URL: `http://localhost:3000/users/register`
- Body: raw JSON (ver arriba)

#### Login de Usuario
**POST** `/users/login`

**Request Body:**
```json
{
  "username": "usuario123",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token_here"
}
```

#### Actualizar Usuario
**POST** `/users/update/:idUser`

**Request Body:**
```json
{
  "username": "nuevo_usuario",
  "email": "nuevo@email.com",
  "password": "nueva_password"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

#### Eliminar Usuario
**DELETE** `/users/delete/:idUser`

**Response (200):**
```json
{
  "message": "Usuario eliminado"
}
```

### Libros

#### Obtener Todos los Libros
**GET** `/books?page=1&limit=10`

**Response (200):**
```json
{
  "data": [ ... ],
  "metadata": {
    "page": 1,
    "limit": 10,
    "totalCount": 100,
    "totalPages": 10
  }
}
```

#### Buscar Libros
**GET** `/books/search?q=harry&page=1&limit=10`

**Response (200):**
```json
{
  "data": [ ... ],
  "metadata": { ... }
}
```

#### Obtener Libro por ID
**GET** `/books/:idBook`

**Response (200):**
```json
{
  "titulo": "El Padrino",
  "autor": "Mario Puzo",
  "sinopsis": "...",
  "categorias": ["Novela", "Drama"],
  "link": "url_del_libro",
  "idioma": "español",
  "anio": 1969,
  "paginas": 500,
  "fileType": "PDF",
  "averageRating": 4.5,
  "totalRatingsCount": 10,
  "isPremium": false,
  "isExclusive": false
}
```

#### Crear Libro
**POST** `/books`

**Request Body:**
```json
{
  "titulo": "Nuevo Libro",
  "portada": "url_portada",
  "sinopsis": "Sinopsis del libro",
  "autor": "Autor del Libro",
  "categorias": ["Categoría1", "Categoría2"],
  "link": "url_del_archivo",
  "idioma": "español",
  "anio": 2023,
  "paginas": 300,
  "fileType": "PDF",
  "isPremium": false,
  "isExclusive": false
}
```

**Response (201):**
```json
{
  "success": true,
  "user": { ... }
}
```

#### Actualizar Libro
**POST** `/books/:idBook`

**Request Body:** (campos a actualizar)

**Response (200):**
```json
{
  "success": true,
  "user": { ... }
}
```

#### Eliminar Libro
**DELETE** `/books/:idBook`

**Response (200):**
```json
{
  "message": "Libro eliminado con éxito"
}
```

### Calificaciones

#### Calificar Libro
**POST** `/rating/:bookId/:userId/:newRating/`

**Parámetros URL:**
- `bookId`: ID del libro
- `userId`: ID del usuario
- `newRating`: Calificación (1-5)

**Response (200):**
```json
{
  "message": "Calificación registrada exitosamente.",
  "data": { ... }
}
```

#### Obtener Calificaciones de Usuario
**GET** `/rating/list/:userId`

**Response (200):**
```json
{
  "message": "Calificaciones del usuario obtenidas exitosamente.",
  "data": [ ... ]
}
```

### Peticiones

#### Crear Petición
**POST** `/peticiones`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "nombreLibro": "Libro Solicitado",
  "autor": "Autor del Libro"
}
```

**Response (201):**
```json
{
  "message": "Petición creada exitosamente",
  "peticion": { ... }
}
```

#### Listar Peticiones
**GET** `/peticiones?page=1&limit=10&status=pendiente`

**Response (200):**
```json
{
  "data": [ ... ],
  "metadata": { ... }
}
```

#### Actualizar Estado de Petición
**PATCH** `/peticiones/:id`

**Request Body:**
```json
{
  "status": "en_busqueda",
  "adminNote": "Nota del administrador"
}
```

**Response (200):**
```json
{
  "message": "Estado actualizado",
  "peticion": { ... }
}
```

### Pagos

#### Webhook de Creem
**POST** `/payment/webhook/creem`

(Este endpoint es para webhooks de la plataforma de pagos Creem, no para uso directo del usuario)