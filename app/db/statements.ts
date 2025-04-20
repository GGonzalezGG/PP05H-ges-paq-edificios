import { DB } from "https://deno.land/x/sqlite/mod.ts";

// Ruta a tu archivo SQLite
const dbPath = "./app/db/database.db";

// Función para realizar un SELECT * FROM Usuarios
export function getAllUsers() {
  const db = new DB(dbPath);

  try {
    // Verifica si la tabla Usuarios existe
    const tableExists = db.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Usuarios';"
    );

    if (tableExists.length === 0) {
      throw new Error("La tabla 'Usuarios' no existe en la base de datos.");
    }

    // Realiza la consulta SELECT * FROM Usuarios
    const rows = db.query("SELECT * FROM Usuarios");

    // Convierte los resultados a un array de objetos
    const users = Array.from(rows, (row) => ({
      id: row[0],
      username: row[1],
      email: row[2],
    }));

    return users;
  } catch (error) {
    console.error("Error al acceder a la base de datos:", error.message);
    throw error; // Propaga el error para manejarlo en la API Route
  } finally {
    // Cierra la conexión a la base de datos
    db.close();
  }
}