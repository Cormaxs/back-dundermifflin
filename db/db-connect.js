import mongoose from 'mongoose';

// URL de conexión a MongoDB. Reemplaza esta URL con la tuya
const mongoURI = 'mongodb://admin-db:proyectoFinal@45.236.128.209:27017/tp_final_nodo?authSource=tp_final_nodo';

// Conectar a la base de datos de MongoDB
export const connectToDatabase = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('Conexión a MongoDB exitosa.');
  } catch (err) {
    console.error('Error al conectar a MongoDB:', err.message);
    process.exit(1); // Salir del proceso con fallo
  }
};