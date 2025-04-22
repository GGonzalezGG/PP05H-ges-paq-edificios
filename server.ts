import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { getAllUsers } from "./app/db/statements.ts";
import { corsHeaders } from "./cors.ts";

// Puerto para el servidor API
const API_PORT = 8000;

async function handler(req: Request): Promise<Response> {
  // Manejo de peticiones OPTIONS para CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const url = new URL(req.url);
  console.log(`${req.method} ${url.pathname}`);
  
  // Ruta para obtener usuarios
  if (url.pathname === "/api/users" && req.method === "GET") {
    try {
      console.log("Obteniendo usuarios de la base de datos...");
      const users = await getAllUsers();
      console.log(`Se encontraron ${users.length} usuarios`);
      
      return new Response(JSON.stringify(users), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200
      });
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      
      return new Response(JSON.stringify({ 
        error: "Error al obtener datos de usuarios",
        details: error instanceof Error ? error.message : String(error)
      }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 500
      });
    }
  }
  
  // Aquí puedes agregar más rutas API según necesites
  
  // Ruta no encontrada
  return new Response("Not Found", { 
    status: 404,
    headers: corsHeaders
  });
}

console.log(`API server running on http://localhost:${API_PORT}`);
await serve(handler, { port: API_PORT });