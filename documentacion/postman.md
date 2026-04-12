# Colección de Postman

Para facilitar las pruebas de la API, puedes importar la siguiente colección en Postman.

## Variables de Entorno en Postman

Configura las siguientes variables en tu entorno de Postman:

- `base_url`: `http://localhost:3000`
- `token`: (se actualizará después del login)

## Ejemplos de Requests

### 1. Registro de Usuario
- **Method**: POST
- **URL**: `{{base_url}}/users/register`
- **Body** (raw JSON):
```json
{
  "username": "testuser",
  "password": "testpass123",
  "email": "test@example.com"
}
```

### 2. Login
- **Method**: POST
- **URL**: `{{base_url}}/users/login`
- **Body** (raw JSON):
```json
{
  "username": "testuser",
  "password": "testpass123"
}
```
- **Test Script** (para guardar el token):
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("token", response.token);
}
```

### 3. Obtener Libros
- **Method**: GET
- **URL**: `{{base_url}}/books?page=1&limit=5`

### 4. Crear Libro (requiere auth)
- **Method**: POST
- **URL**: `{{base_url}}/books`
- **Headers**:
  - `Authorization`: `Bearer {{token}}`
- **Body** (raw JSON):
```json
{
  "titulo": "Libro de Prueba",
  "autor": "Autor de Prueba",
  "link": "https://example.com/libro.pdf",
  "categorias": ["Prueba"]
}
```

### 5. Calificar Libro
- **Method**: POST
- **URL**: `{{base_url}}/rating/{bookId}/{userId}/4`
- **Headers**:
  - `Authorization`: `Bearer {{token}}`

### 6. Crear Petición
- **Method**: POST
- **URL**: `{{base_url}}/peticiones`
- **Headers**:
  - `Authorization`: `Bearer {{token}}`
- **Body** (raw JSON):
```json
{
  "nombreLibro": "Libro que quiero",
  "autor": "Autor conocido"
}
```

## Notas

- Reemplaza `{bookId}` y `{userId}` con IDs reales obtenidos de responses anteriores.
- Para endpoints que requieren autenticación, incluye el header `Authorization: Bearer {{token}}`.
- Asegúrate de que el servidor esté corriendo antes de hacer las requests.