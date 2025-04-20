import { getAllUsers } from "../db/statements.ts";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Obtiene los usuarios de la base de datos
      const users = getAllUsers();

      // Devuelve los usuarios como respuesta JSON
      res.status(200).json(users);
    } catch (error) {
      // Maneja errores y devuelve una respuesta de error
      res.status(500).json({ error: error.message });
    }
  } else {
    // Método no permitido
    res.status(405).json({ error: "Método no permitido" });
  }
}