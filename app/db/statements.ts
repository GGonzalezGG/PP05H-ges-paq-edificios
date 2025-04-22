import { DB } from "https://deno.land/x/sqlite/mod.ts";
// Ruta a tu archivo SQLite
const dbPath = "./app/db/database.db";
// Función para realizar un SELECT * FROM Usuarios
export function getAllUsers() {
  const db = new DB(dbPath);
  try {
    // Realiza la consulta SELECT * FROM Usuarios
    const rows = db.query("SELECT * FROM Usuarios");
    // Convierte los resultados a un array de objetos
    const users = Array.from(rows, (row) => ({
      id: row[0],
      username: row[1],
      password: row[2],
      N_departamento: row[3],
      admin: row[4],
      rut: row[5],
      nombre: row[6],
      apellido: row[7],
      correo: row[8],
      telefono: row[9],
      retiro_compartido: row[10]
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