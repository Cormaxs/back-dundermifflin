import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const secretKey = 'michaelscott'; // Clave secreta para JWT

// Cifrado de contraseña
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Comparación de contraseña
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generación de JWT (JSON Web Token)
export const generateToken = (user) => {
  
  const payload = {
    id: user._id,
    role: user.role,
    plan: user.planType, 
    isSubscribed: user.isSubscribed, 
    username: user.username, 
  };
  return jwt.sign(payload, secretKey, { expiresIn: "24h" });
};