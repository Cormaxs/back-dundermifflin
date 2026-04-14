import jwt from 'jsonwebtoken';

const secretKey = 'michaelscott'; // Debe coincidir con la clave usada en auth.utils.js

// Middleware para verificar el token JWT
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.substring(7); // Remover 'Bearer '

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Adjuntar los datos del usuario al request
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido' });
  }
};

// Middleware para verificar si el usuario es admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Acceso denegado: se requiere rol de admin' });
  }
};

// Middleware para permitir acceso a users y admin (admin ve todas, user solo sus peticiones)
export const allowUserOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'user')) {
    req.userRole = req.user.role;
    next();
  } else {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
};