// models/user.model.js
import mongoose from 'mongoose';

// Define el esquema del usuario
const userSchema = new mongoose.Schema({
    // Nombre de usuario, requerido y único
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true, // Elimina espacios en blanco al inicio y al final
        minlength: 3 // Mínimo de 3 caracteres
    },
    // Contraseña, requerida y con un mínimo de 6 caracteres
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // Correo electrónico, requerido y único
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true, // Convierte el email a minúsculas
        match: [/.+@.+\..+/, "Por favor, ingrese un correo válido"] // Valida el formato del email
    },
    // Rol del usuario (ej. 'admin', 'user'), con un valor por defecto
   role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    // MEJORA: Definimos los 3 planes
    planType: {
        type: String,
        enum: ['free', 'lector', 'erudito'],
        default: 'free'
    },
    isSubscribed: {
        type: Boolean,
        default: false
    },
    // NUEVO: Lista de favoritos
    favoritos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookDundderMifflin'
    }],
    creemCustomerId: {
        type: String, // ID del cliente en la plataforma de pagos
        unique: true,
        sparse: true // Permite que sea null hasta que se registre en Creem
    },
    subscriptionStatus: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'none'],
        default: 'none'
    }
}, {
    // Agrega campos de fecha de creación y actualización
    timestamps: true
});
//busca suscripciones activas
userSchema.index({ planType: 1, isSubscribed: 1 });


// Crea el modelo a partir del esquema
const User = mongoose.model('UserDundderMifflin', userSchema);

export default User;