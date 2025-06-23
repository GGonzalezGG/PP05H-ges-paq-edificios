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
  getResidentPackages,
  getPaquetesPorVencer,
  getPaquetesPendientes,
  getEstadisticasPaquetes,
  getAllReclamos,
  retirarPaquete,
  generarCodigoQRRetiro,
  procesarEscaneoQR,
  limpiarCodigosQRExpirados,
  updateReclamoStatus,
  crearReclamo
} from "./app/db/statements.ts";
import { corsHeaders } from "./cors.ts";
import { addValidToken, verifyToken, removeToken } from "./app/db/auth.ts";
import { enviarMensajeTemplate, enviarMensajeDetallado } from "./app/services/whatsappService.ts";
import { testConnection } from "./app/db/statements.ts";

console.log("iniciando test de conexión");
// Probar conexión al inicio
const connectionTest = await testConnection();
console.log("Test de conexión:", connectionTest);



async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Nueva función para revisar paquetes próximos a vencer
async function revisarPaquetesPorVencer(): Promise<void> {
  console.log("🔍 Iniciando revisión de paquetes próximos a vencer...");
  
  try {
    // Obtener paquetes que vencen en 3 días
    const paquetesPorVencer = await getPaquetesPorVencer(3);
    
    if (paquetesPorVencer.length === 0) {
      console.log("✅ No hay paquetes próximos a vencer");
      return;
    }
    
    console.log(`📦 Encontrados ${paquetesPorVencer.length} paquetes próximos a vencer`);
    
    for (const paquete of paquetesPorVencer) {
      try {
        console.log(`📱 Procesando paquete ID: ${paquete.ID_pack} para ${paquete.nombre_destinatario}`);
        
        // Verificar si ya se envió notificación de vencimiento para este paquete
        // (esto evita spam diario)
        if (paquete.notificacion_vencimiento_enviada) {
          console.log(`⚠️ Ya se envió notificación de vencimiento para paquete ${paquete.ID_pack}`);
          continue;
        }
        
        // Obtener información de contacto del destinatario
        const contactoUsuario = await getUsuarioContactInfo(paquete.ID_userDestinatario);
        
        if (!contactoUsuario.success || !contactoUsuario.data.telefono) {
          console.log(`❌ No se pudo obtener teléfono para usuario ${paquete.ID_userDestinatario}`);
          continue;
        }
        
        // Enviar notificación por WhatsApp
        console.log(`📲 Enviando notificación de vencimiento a ${contactoUsuario.data.telefono}`);
        
        const envioExitoso = await enviarMensajeTemplate(contactoUsuario.data.telefono);
        
        if (envioExitoso) {
          // Registrar que se envió la notificación de vencimiento
          await registrarEstadoNotificacionWhatsApp(
            paquete.ID_pack,
            paquete.ID_userDestinatario,
            "notificacion_vencimiento_enviada"
          );
          
          console.log(`✅ Notificación de vencimiento enviada para paquete ${paquete.ID_pack}`);
        } else {
          console.log(`❌ Error al enviar notificación de vencimiento para paquete ${paquete.ID_pack}`);
          
          await registrarEstadoNotificacionWhatsApp(
            paquete.ID_pack,
            paquete.ID_userDestinatario,
            "error_notificacion_vencimiento"
          );
        }
        
        // Pequeña pausa entre envíos para no saturar la API
        await sleep(1000);
        
      } catch (error) {
        console.error(`❌ Error procesando paquete ${paquete.ID_pack}:`, error);
      }
    }
    
    console.log("✅ Revisión de paquetes próximos a vencer completada");
    
  } catch (error) {
    console.error("❌ Error en revisión de paquetes por vencer:", error);
  }
}

// Función para iniciar el cron job de notificaciones
function iniciarRevisionPeriodica(): void {
  console.log("⏰ Iniciando sistema de revisión periódica de paquetes...");
  
  // Ejecutar inmediatamente al iniciar
  revisarPaquetesPorVencer();
  
  // Ejecutar cada 24 horas (86400000 ms)
  setInterval(() => {
    const ahora = new Date();
    console.log(`⏰ Ejecutando revisión programada - ${ahora.toLocaleString('es-ES')}`);
    revisarPaquetesPorVencer();
  }, 24 * 60 * 60 * 1000);
  
  // También ejecutar cada 6 horas para mayor frecuencia
  // setInterval(() => {
  //   const ahora = new Date();
  //   console.log(`⏰ Ejecutando revisión (6h) - ${ahora.toLocaleString('es-ES')}`);
  //   revisarPaquetesPorVencer();
  // }, 6 * 60 * 60 * 1000);
  
  console.log("✅ Sistema de revisión periódica configurado");
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
      //await sleep(2000);
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
    const result = await getResidentPackages(userId);
    console.log("salimos de la query")
    console.log("success?: "+ result.success);
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
      console.log("estamos en mala response")
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

// ENDPOINT: Obtener paquetes pendientes
if (url.pathname === "/api/paquetes/pendientes" && req.method === "GET") {
  try {
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
    
    console.log("Obteniendo paquetes pendientes");
    const paquetes = await getPaquetesPendientes();
    
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
    console.error("Error al obtener paquetes pendientes:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Error al obtener paquetes pendientes",
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

// ENDPOINT: Obtener estadísticas de paquetes
if (url.pathname === "/api/paquetes/estadisticas" && req.method === "GET") {
  try {
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
    
    console.log("Obteniendo estadísticas de paquetes");
    const estadisticas = await getEstadisticasPaquetes();
    
    return new Response(JSON.stringify({
      success: true,
      data: estadisticas
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Error al obtener estadísticas",
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

// ENDPOINT: Retirar paquete
if (url.pathname.startsWith("/api/paquetes/") && url.pathname.endsWith("/retirar") && req.method === "POST") {
  try {
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

    // Extraer el ID del paquete de la URL
    const pathParts = url.pathname.split('/');
    const packageId = parseInt(pathParts[3]);
    console.log("ID paquete: " + packageId);
    
    if (isNaN(packageId)) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID de paquete inválido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

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

    console.log("userID: " + userId)

    console.log(`Retirando paquete ${packageId} por usuario ${userId}`);
    const result = await retirarPaquete(packageId, userId);
    
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });
  } catch (error) {
    console.error("Error al retirar paquete:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Error al retirar paquete",
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

// ENDPOINT: Obtener todos los reclamos (ejemplo extensible)
if (url.pathname === "/api/reclamos" && req.method === "GET") {
  try {
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
    
    console.log("Obteniendo lista de reclamos");
    const reclamos = await getAllReclamos();
    
    return new Response(JSON.stringify({
      success: true,
      data: reclamos
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });
  } catch (error) {
    console.error("Error al obtener reclamos:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Error al obtener reclamos",
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
// Endpoint para generar código QR de retiro
if (url.pathname === "/api/resident/generate-qr" && req.method === "POST") {
  try {
    // Verificar autenticación
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

    const token = authHeader.substring(7);
    const userData = verifyToken(token);
    
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        error: "Token inválido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 401
      });
    }

    const body = await req.json();
    const { paqueteId } = body;

    if (!paqueteId) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID del paquete requerido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    // Generar código QR
    const resultado = await generarCodigoQRRetiro(paqueteId, userData.userId);
    
    return new Response(JSON.stringify({
      success: true,
      data: resultado
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });

  } catch (error) {
    console.error("Error al generar código QR:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Error interno del servidor"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 500
    });
  }
}

// Endpoint para procesar escaneo de QR
if (url.pathname === "/api/admin/scan-qr" && req.method === "POST") {
  try {
    // Verificar autenticación
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

    const token = authHeader.substring(7);
    const userData = verifyToken(token);
    
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        error: "Token inválido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 401
      });
    }

    //
    if (!userData) {
      return new Response(JSON.stringify({
        success: false,
        error: "Acceso denegado. Solo administradores y conserjes pueden escanear códigos QR"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 403
      });
    }

    const body = await req.json();
    const { codigoQR } = body;

    if (!codigoQR) {
      return new Response(JSON.stringify({
        success: false,
        error: "Código QR requerido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    // Procesar escaneo
    const resultado = await procesarEscaneoQR(codigoQR, userData.userId);
    
    return new Response(JSON.stringify({
      success: resultado.success,
      data: resultado.success ? resultado.paqueteInfo : null,
      error: resultado.success ? null : resultado.error
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: resultado.success ? 200 : 400
    });

  } catch (error) {
    console.error("Error al procesar escaneo QR:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Error interno del servidor"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 500
    });
  }
}

// Endpoint para limpiar códigos QR expirados
if (url.pathname === "/api/admin/cleanup-expired-qr" && req.method === "POST") {
  try {
    const resultado = await limpiarCodigosQRExpirados();
    
    return new Response(JSON.stringify({
      success: true,
      data: resultado
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });

  } catch (error) {
    console.error("Error al limpiar códigos QR:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Error al limpiar códigos QR"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 500
    });
  }
}

// NUEVO ENDPOINT en server.ts - Actualizar estado de reclamo
if (url.pathname.startsWith("/api/reclamos/") && req.method === "PUT") {
  try {
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

    // Extraer ID del reclamo de la URL
    const pathParts = url.pathname.split("/");
    const reclamoId = parseInt(pathParts[pathParts.length - 1]);
    
    if (isNaN(reclamoId)) {
      return new Response(JSON.stringify({
        success: false,
        error: "ID de reclamo inválido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    const requestBody = await req.json();
    const { status } = requestBody;

    if (!status) {
      return new Response(JSON.stringify({
        success: false,
        error: "Estado requerido"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    // Validar estados permitidos
    const estadosValidos = ['pendiente', 'en_revision', 'completado'];
    if (!estadosValidos.includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: "Estado no válido. Estados permitidos: " + estadosValidos.join(', ')
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }
   
    console.log(`Actualizando reclamo ${reclamoId} a estado: ${status}`);
    const reclamoActualizado = await updateReclamoStatus(reclamoId, status);
   
    return new Response(JSON.stringify({
      success: true,
      data: reclamoActualizado,
      message: "Estado del reclamo actualizado correctamente"
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 200
    });
  } catch (error) {
    console.error("Error al actualizar estado del reclamo:", error);
   
    return new Response(JSON.stringify({
      success: false,
      error: "Error al actualizar estado del reclamo",
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

// ENDPOINT: Crear reclamo de residente
if (url.pathname === "/api/resident/complaint" && req.method === "POST") {
  try {
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

    const tokenData = verifyToken(token);
    const userId = tokenData.userId;
    
    const body = await req.json();
    const { packageId, description } = body;
    
    // Validaciones
    if (!packageId || !description) {
      return new Response(JSON.stringify({
        success: false,
        error: "Faltan datos requeridos"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    if (description.trim().length < 10) {
      return new Response(JSON.stringify({
        success: false,
        error: "La descripción debe tener al menos 10 caracteres"
      }), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        },
        status: 400
      });
    }

    console.log(`Creando reclamo para usuario ${userId}, paquete ${packageId}`);
    
    // Importar la función (agregar a la línea de imports al inicio del archivo)
    const reclamo = await crearReclamo(userId, packageId, description.trim());
    
    return new Response(JSON.stringify({
      success: true,
      message: "Reclamo creado exitosamente",
      data: reclamo
    }), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      },
      status: 201
    });
    
  } catch (error) {
    console.error("Error al crear reclamo:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: "Error al procesar el reclamo",
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

// Iniciar el sistema de revisión periódica
iniciarRevisionPeriodica();

console.log(`API server running on http://localhost:${API_PORT}`);
await serve(handler, { port: API_PORT });