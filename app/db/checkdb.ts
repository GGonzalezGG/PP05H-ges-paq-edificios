// En /app/db/checkdb.ts
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";

const currentDir = Deno.cwd();
const dbPath = join(currentDir, "app", "db", "database.db");

console.log(`Verificando base de datos en: ${dbPath}`);

try {
  // Verifica si el archivo existe
  try {
    const fileInfo = Deno.statSync(dbPath);
    console.log("El archivo existe:", fileInfo.isFile);
  } catch {
    console.log("El archivo de base de datos no existe");
    Deno.exit(1);
  }

  // Intenta abrir la base de datos
  const db = new DB(dbPath);
  
  // Verifica si la tabla existe
  try {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name='Usuarios'");
    const tableExists = Array.from(tables).length > 0;
    console.log("La tabla Usuarios existe:", tableExists);
    
    if (tableExists) {
      // Cuenta los registros
      const count = db.query("SELECT COUNT(*) FROM Usuarios");
      console.log("Número de usuarios:", Array.from(count)[0][0]);
    }
  } catch (error) {
    console.log("Error al verificar la tabla:", error.message);
  }
  
  db.close();
} catch (error) {
  console.log("Error al abrir la base de datos:", error.message);
}