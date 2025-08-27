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
        enum: ['admin', 'user'], // Solo permite estos valores
        default: 'user'
    }
}, {
    // Agrega campos de fecha de creación y actualización
    timestamps: true
});

// Crea el modelo a partir del esquema
const User = mongoose.model('UserDundderMifflin', userSchema);

export default User;