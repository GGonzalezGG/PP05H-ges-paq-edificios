import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

let db: DB | null = null;

export function getDb(): DB {
  if (!db) {
    // Inicializar la conexión a la base de datos
    db = new DB("./app/db/database.db");
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}