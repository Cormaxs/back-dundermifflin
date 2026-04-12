# Modelos de Datos

## Usuario (UserDundderMifflin)

```javascript
{
  username: String (requerido, único, min 3 chars),
  password: String (requerido, min 6 chars),
  email: String (requerido, único, formato email),
  role: String (enum: ['admin', 'user'], default: 'user'),
  planType: String (enum: ['free', 'lector', 'erudito'], default: 'free'),
  isSubscribed: Boolean (default: false),
  favoritos: [ObjectId] (referencias a libros),
  creemCustomerId: String (único, sparse),
  subscriptionStatus: String (enum: ['active', 'past_due', 'canceled', 'none'], default: 'none'),
  createdAt: Date,
  updatedAt: Date
}
```

## Libro (BookDundderMifflin)

```javascript
{
  titulo: String (requerido, único),
  portada: String,
  sinopsis: String,
  autor: String,
  categorias: [String],
  link: String (requerido),
  idioma: String (default: 'español'),
  anio: Number,
  paginas: Number,
  fileType: String (default: 'PDF'),
  creator: ObjectId (referencia a usuario),
  averageRating: Number (default: 0),
  totalRatingsCount: Number (default: 0),
  isPremium: Boolean (default: false),
  isExclusive: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

## Calificación (Rating)

```javascript
{
  rating: Number (1-5, requerido),
  book: ObjectId (requerido, referencia a libro),
  user: ObjectId (requerido, referencia a usuario),
  createdAt: Date,
  updatedAt: Date
}
```

## Petición (Peticiones)

```javascript
{
  userId: ObjectId (requerido, referencia a usuario),
  nombreLibro: String (requerido),
  autor: String,
  status: String (enum: ['pendiente', 'en_busqueda', 'subido', 'no_encontrado'], default: 'pendiente'),
  prioridad: Boolean (default: false),
  adminNote: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Suscripción (Subscription)

(Información adicional sobre suscripciones, si aplica)