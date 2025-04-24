// server.ts
import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { getAllUsers, authenticateUser } from "./app/db/statements.ts";
import { corsHeaders } from "./cors.ts";
import { addValidToken, verifyToken, removeToken } from "./app/db/auth.ts";


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
      
      const usersArray = Array.isArray(users) ? users : [];
    
    return new Response(JSON.stringify(usersArray), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: "Error al obtener datos de usuarios",
      details: error instanceof Error ? error.message : String(error),
      // Devolver array vacío
      data: []
    }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 500
    });
  }
}
  
  // Ruta para autenticación de usuarios
  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      console.log("Esperando datos");
      const body = await req.json();
      const { username, password } = body;
      console.log("Datos obtenidos:" + body);
      console.log("verificando si se entregaron ambas")
      if (!username || !password) {
        return new Response(JSON.stringify({
          success: false,
          error: "Usuario y contraseña son requeridos"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 400
        });
      }
      console.log("Autenticado datos de usuario")
      const result = await authenticateUser(username, password);
      
      if (result.success) {
        console.log("exito, generando token")
        // Generar un token simple (en producción deberías usar JWT)
        const token = crypto.randomUUID();
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            token,
            user: result.user,
            redirectTo: result.redirectTo
          }
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 200
        });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: result.error
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 401
        });
      }
    } catch (error) {
      console.error("Error en login:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "Error al procesar la solicitud",
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

  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    try {
      const body = await req.json();
      const { token } = body;
      
      if (token) {
        removeToken(token);
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Sesión cerrada correctamente"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200
      });
    } catch (error) {
      console.error("Error en logout:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "Error al procesar la solicitud"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 500
      });
    }
  }
  
  // Ruta no encontrada
  return new Response("Not Found", { 
    status: 404,
    headers: corsHeaders
  });
}

console.log(`API server running on http://localhost:${API_PORT}`);
await serve(handler, { port: API_PORT });