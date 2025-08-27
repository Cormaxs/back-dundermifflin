import Express from "express";
import { connectToDatabase } from "./db/db-connect.js";
import cors from "cors";
import { users } from "./routes/users.js";
import {books} from "./routes/libros.js";

const app = Express();
const PORT = process.env.PORT || 3000;
let db;

app.use(Express.json());
app.use(cors()); // 2. Usa cors como un middleware. Esto permite todas las peticiones.


app.use("/users", users);
app.use("/books", books);

// Conectar a la base de datos antes de iniciar el servidor
connectToDatabase()
  .then((database) => {
    db = database;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "No se pudo conectar a la base de datos. El servidor no se iniciará.",
      err
    );
    process.exit(1); // Salir si la conexión falla
  });
