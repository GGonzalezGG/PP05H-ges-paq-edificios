// app/db/statements.ts
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

// Función para autenticar usuario
// app/db/statements.ts - actualización de la función authenticateUser

export function authenticateUser(username: string, password: string) {
  const db = new DB(dbPath);
  try {
    // Consulta segura usando parámetros
    const query = "SELECT * FROM Usuarios WHERE username = ? AND password = ?";
    const rows = db.query(query, [username, password]);
    
    // Convertir resultado a objeto (si existe)
    const users = Array.from(rows, (row) => ({
      id: row[0],
      username: row[1],
      password: row[2],
      N_departamento: row[3],
      admin: row[4] === 1, // Convertir explícitamente a booleano
      rut: row[5],
      nombre: row[6],
      apellido: row[7],
      correo: row[8],
      telefono: row[9],
      retiro_compartido: row[10] === 1 // Convertir explícitamente a booleano
    }));
    
    // Si encontramos un usuario, regresamos sus datos
    if (users.length > 0) {
      // No devolver la contraseña en la respuesta
      const user = users[0];
      const { password, ...userWithoutPassword } = user;
      
      console.log("Usuario autenticado:", userWithoutPassword);
      console.log("Es admin:", user.admin);
      
      return {
        success: true,
        user: userWithoutPassword,
        redirectTo: user.admin === true ? "/admin" : "/residente" // Asegurarse de que la comparación sea correcta
      };
    }
    
    console.log("Credenciales inválidas para:", username);
    // Si no encontramos un usuario, regresamos error
    return {
      success: false,
      error: "Credenciales inválidas"
    };
  } catch (error) {
    console.error("Error al autenticar usuario:", error.message);
    throw error;
  } finally {
    db.close();
  }
}