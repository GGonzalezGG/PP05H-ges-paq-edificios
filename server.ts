// server.ts
import { serve } from "https://deno.land/std@0.219.0/http/server.ts";
import { 
  getAllUsers, 
  authenticateUser, 
  getUsersByDepartamento,
  registrarPaquete,
  crearNotificacion,
  getAllPaquetes,
  getUsuarioContactInfo,
  registrarEstadoNotificacionWhatsApp,
  createUser,
  getResidentPackages
} from "./app/db/statements.ts";
import { corsHeaders } from "./cors.ts";
import { addValidToken, verifyToken, removeToken } from "./app/db/auth.ts";
import { enviarMensajeTemplate, enviarMensajeDetallado } from "./app/services/whatsappService.ts";


async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  
  // NUEVO ENDPOINT: Obtener usuarios por departamento
  if (url.pathname === "/api/users/departamento" && req.method === "GET") {
    try {
      const departamento = url.searchParams.get("departamento");
      
      if (!departamento) {
        return new Response(JSON.stringify({
          success: false,
          error: "El número de departamento es requerido"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 400
        });
      }
      
      console.log(`Buscando usuarios del departamento: ${departamento}`);
      const users = await getUsersByDepartamento(departamento);
      
      return new Response(JSON.stringify({
        success: true,
        data: users
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200
      });
    } catch (error) {
      console.error("Error al obtener usuarios por departamento:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "Error al obtener usuarios por departamento",
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
  
  // NUEVO ENDPOINT: Registrar un nuevo paquete y su notificación
  if (url.pathname === "/api/paquetes/registrar" && req.method === "POST") {
    try {
      // Verificar autenticación y permisos (administrador)
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.split("Bearer ")[1];
      
      if (!token || !verifyToken(token)) {
        return new Response(JSON.stringify({
          success: false,
          error: "No autorizado"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 401
        });
      }
      
      // Obtener datos del cuerpo de la solicitud
      const body = await req.json();
      const { idDestinatario, fechaLimite, ubicacion, descripcion } = body;
      
      // Validaciones
      if (!idDestinatario || !ubicacion) {
        return new Response(JSON.stringify({
          success: false,
          error: "Faltan datos requeridos: idDestinatario y ubicacion son obligatorios"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 400
        });
      }
      
      // Registrar el paquete
      console.log("Registrando nuevo paquete");
      const paqueteResult = await registrarPaquete(
        idDestinatario,
        ubicacion,
        fechaLimite || null
      );
      
      // Crear la notificación asociada
      console.log("Creando notificación para el paquete");
      const notificacionResult = await crearNotificacion(
        paqueteResult.paqueteId,
        paqueteResult.nombreUsuario,
        paqueteResult.fechaEntrega,
        descripcion || null
      );
      
      // Obtener información de contacto del usuario
      const contactoUsuario = await getUsuarioContactInfo(idDestinatario);
      
      let whatsappStatus = "no_enviado";
      let whatsappMessage = "No se intentó enviar notificación por WhatsApp";
      
      // Intentar enviar notificación por WhatsApp si tenemos número de teléfono
      if (contactoUsuario.success && contactoUsuario.data.telefono) {
        try {
          console.log("Enviando notificación por WhatsApp");
          const nombreCompleto = `${contactoUsuario.data.nombre} ${contactoUsuario.data.apellido}`;
          
          // Enviar mensaje template
          const envioExitoso = await enviarMensajeTemplate(
            contactoUsuario.data.telefono
          );
          
          if (envioExitoso) {
            // Registrar estado de notificación en la base de datos
            await registrarEstadoNotificacionWhatsApp(
              paqueteResult.paqueteId,
              idDestinatario,
              "template_enviado"
            );
            
            whatsappStatus = "template_enviado";
            whatsappMessage = "Mensaje template de WhatsApp enviado exitosamente";
          } else {
            await registrarEstadoNotificacionWhatsApp(
              paqueteResult.paqueteId,
              idDestinatario,
              "error_envio"
            );
            
            whatsappStatus = "error_envio";
            whatsappMessage = "Error al enviar mensaje template de WhatsApp";
          }
        } catch (whatsappError) {
          console.error("Error en notificación WhatsApp:", whatsappError);
          whatsappStatus = "error";
          whatsappMessage = "Error en el sistema de notificaciones WhatsApp";
        }
      } else {
        whatsappStatus = "sin_telefono";
        whatsappMessage = "El usuario no tiene número de teléfono registrado";
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: "Paquete y notificación registrados correctamente",
        data: {
          paquete: {
            id: paqueteResult.paqueteId,
            fechaEntrega: paqueteResult.fechaEntrega
          },
          notificacion: {
            mensaje: notificacionResult.mensaje,
            fechaEnvio: notificacionResult.fechaEnvio
          },
          whatsapp: {
            status: whatsappStatus,
            message: whatsappMessage
          }
        }
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 201
      });
    } catch (error) {
      console.error("Error al registrar paquete:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "Error al registrar paquete y notificación",
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

  // Webhook para recibir notificaciones de WhatsApp
if (url.pathname === "/api/webhook/whatsapp" && req.method === "POST") {
  try {
    const body = await req.json();
    
    // Procesar la entrada del webhook
    if (body.object && body.entry && 
        body.entry.length > 0 && 
        body.entry[0].changes && 
        body.entry[0].changes.length > 0) {
      
      const change = body.entry[0].changes[0];
      
      // Verificar si es un mensaje entrante
      if (change.value && 
          change.value.messages && 
          change.value.messages.length > 0) {
        
        const message = change.value.messages[0];
        const from = message.from; // Número de teléfono del remitente
        const messageId = message.id;
        const timestamp = message.timestamp;
        const messageText = message.text?.body || "";
        
        console.log(`Mensaje recibido de ${from}: ${messageText}`);
        
        // Buscar el usuario por número de teléfono y verificar si tiene paquetes pendientes
        const db = new DB(config.dbPath);
        
        try {
          // Buscar usuario por teléfono
          const telefonoFormateado = from.replace(/^\+/, ""); // Eliminar el + inicial si existe
          
          const usuarioQuery = `
            SELECT ID_usuario, nombre, apellido 
            FROM Usuarios 
            WHERE telefono LIKE ?
          `;
          
          const usuarioResult = db.query(usuarioQuery, [`%${telefonoFormateado}%`]);
          const usuarioData = Array.from(usuarioResult);
          
          if (usuarioData.length === 0) {
            console.log(`No se encontró usuario para el teléfono ${from}`);
            return new Response(JSON.stringify({ success: true }), {
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              },
              status: 200
            });
          }
          
          const idUsuario = usuarioData[0][0] as number;
          const nombreUsuario = usuarioData[0][1] as string;
          const apellidoUsuario = usuarioData[0][2] as string;
          
          // Buscar el último paquete registrado para este usuario
          const paqueteQuery = `
            SELECT p.ID_paquete, p.fecha_entrega, p.ubicacion, p.fecha_limite, p.descripcion, 
                  nw.estado
            FROM Paquetes p
            LEFT JOIN NotificacionesWhatsApp nw ON p.ID_paquete = nw.ID_paquete
            WHERE p.ID_userDestinatario = ?
            AND p.fecha_retiro IS NULL
            AND (nw.estado = 'template_enviado' OR nw.estado IS NULL)
            ORDER BY p.fecha_entrega DESC
            LIMIT 1
          `;
          
          const paqueteResult = db.query(paqueteQuery, [idUsuario]);
          const paqueteData = Array.from(paqueteResult);
          
          if (paqueteData.length > 0) {
            const paqueteId = paqueteData[0][0] as number;
            const fechaEntrega = paqueteData[0][1] as string;
            const ubicacion = paqueteData[0][2] as string;
            const fechaLimite = paqueteData[0][3] as string | null;
            const descripcion = paqueteData[0][4] as string | null;
            
            // Actualizar estado de notificación a respondido
            await registrarEstadoNotificacionWhatsApp(
              paqueteId,
              idUsuario,
              "respuesta_recibida",
              messageId
            );
            
            // Enviar detalles del paquete
            await enviarMensajeDetallado(
              from,
              {
                fecha: fechaEntrega,
                ubicacion: ubicacion,
                descripcion: descripcion || undefined
              }
            );
            
            // Actualizar estado de notificación
            await registrarEstadoNotificacionWhatsApp(
              paqueteId,
              idUsuario,
              "detalles_enviados",
              messageId
            );
          } else {
            console.log(`No se encontraron paquetes pendientes para el usuario ${idUsuario}`);
          }
        } finally {
          db.close();
        }
      }
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });
  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Error al procesar webhook"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 500
    });
  }
}

// Endpoint GET para verificar webhook de WhatsApp
if (url.pathname === "/api/webhook/whatsapp" && req.method === "GET") {
  // Verificar token de verificación que proporciona WhatsApp
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  
  const verifyToken = "TU_TOKEN_DE_VERIFICACION"; // Define tu token de verificación
  
  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verificado exitosamente");
    return new Response(challenge, {
      headers: corsHeaders,
      status: 200
    });
  } else {
    return new Response("Verificación fallida", {
      headers: corsHeaders,
      status: 403
    });
  }
}
  
  // NUEVO ENDPOINT: Obtener todos los paquetes (para panel de administración)
  if (url.pathname === "/api/paquetes" && req.method === "GET") {
    try {
      // Verificar autenticación y permisos
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.split("Bearer ")[1];
      
      if (!token || !verifyToken(token)) {
        return new Response(JSON.stringify({
          success: false,
          error: "No autorizado"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 401
        });
      }
      
      console.log("Obteniendo lista de paquetes");
      const paquetes = await getAllPaquetes();
      
      return new Response(JSON.stringify({
        success: true,
        data: paquetes
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 200
      });
    } catch (error) {
      console.error("Error al obtener paquetes:", error);
      
      return new Response(JSON.stringify({
        success: false,
        error: "Error al obtener paquetes",
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
  
  // Ruta para autenticación de usuarios
  if (url.pathname === "/api/auth/login" && req.method === "POST") {
    try {
      console.log("Esperando datos");
      const body = await req.json();
      console.log("sleep para ver el toast")
      await sleep(2000);
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
        
        // Guardar token válido
        addValidToken(token, result.user.id);
        
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

if (url.pathname === "/api/resident/packages" && req.method === "GET") {
  try {
    // Verificar el token de autorización
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        success: false,
        error: "Token de autorización requerido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 401
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const tokenResult = verifyToken(token);
    
    // Manejar la respuesta de verifyToken correctamente
    let userId;
    if (typeof tokenResult === 'object' && tokenResult !== null) {
      // Si verifyToken devuelve un objeto { valid: boolean, userId?: number }
      if (!tokenResult.valid || !tokenResult.userId) {
        return new Response(JSON.stringify({
          success: false,
          error: "Token inválido o expirado"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 401
        });
      }
      userId = tokenResult.userId;
    } else {
      // Si verifyToken devuelve directamente el userId o null/undefined
      if (!tokenResult) {
        return new Response(JSON.stringify({
          success: false,
          error: "Token inválido o expirado"
        }), {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          },
          status: 401
        });
      }
      userId = tokenResult;
    }

    console.log(`=== USUARIO AUTENTICADO ===`);
    console.log(`User ID: ${userId}`);
    console.log(`=== FIN AUTH ===`);

    // Obtener paquetes del residente
    const result = getResidentPackages(userId);
    
    if (result.success) {
      return new Response(JSON.stringify({
        success: true,
        data: {
          packages: result.packages
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
        status: 400
      });
    }

  } catch (error) {
    console.error("Error al obtener paquetes del residente:", error);
    
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
// Ruta para crear usuario
if (url.pathname === "/api/users" && req.method === "POST") {
  try {
    // Verificar autenticación
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({
        success: false,
        message: "Token de autorización requerido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 401
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const isValidToken = await verifyToken(token);
    
    if (!isValidToken) {
      return new Response(JSON.stringify({
        success: false,
        message: "Token inválido o expirado"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 401
      });
    }

    // Obtener datos del cuerpo de la petición
    const userData = await req.json();
    
    // Validaciones básicas
    if (!userData.username || !userData.password || !userData.nombre || 
        !userData.apellido || !userData.rut || !userData.correo || 
        !userData.N_departamento) {
      return new Response(JSON.stringify({
        success: false,
        message: "Faltan campos requeridos"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.correo)) {
      return new Response(JSON.stringify({
        success: false,
        message: "Formato de correo electrónico inválido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    // Validar longitud de contraseña
    if (userData.password.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    console.log("Creando usuario:", userData.username);
    
    // Crear el usuario
    const newUser = await createUser(userData);
    
    console.log("Usuario creado exitosamente:", newUser.id);

    // No devolver la contraseña en la respuesta
    const { password, ...userWithoutPassword } = newUser;

    return new Response(JSON.stringify({
      success: true,
      message: "Usuario creado exitosamente",
      data: userWithoutPassword
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 201
    });

  } catch (error) {
    console.error("Error al crear usuario:", error);
    
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : "Error al crear usuario",
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
  
  // Ruta no encontrada
  return new Response("Not Found", { 
    status: 404,
    headers: corsHeaders
  });
}

console.log(`API server running on http://localhost:${API_PORT}`);
await serve(handler, { port: API_PORT });