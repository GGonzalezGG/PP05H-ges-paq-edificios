// app/db/statements.ts
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import "jsr:@std/dotenv/load";

// Configuración corregida para Azure Database for PostgreSQL
const dbConfig = {
  user: Deno.env.get("DB_USER"),
  password: Deno.env.get("DB_PASSWORD"),
  database: Deno.env.get("DB_NAME"),
  hostname: Deno.env.get("DB_HOST"),
  port: parseInt(Deno.env.get("DB_PORT")),
  // Configuración TLS específica para Azure PostgreSQL
  tls: {
    enabled: true,
    enforce: true, // Cambiado a true para Azure
    caCertificates: [], // Azure maneja los certificados automáticamente
  },
  // Configuración adicional para Azure
  connection: {
    // Evitar usar socket connection para Azure
    attempts: 1,
  }
};

// Función helper para crear conexión con manejo de errores mejorado
async function getConnection() {
  try {
    const client = new Client(dbConfig);
    await client.connect();
    return client;
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    console.error("Configuración utilizada:", {
      ...dbConfig,
      password: "***" // No mostrar la contraseña en los logs
    });
    throw error;
  }
}

// Función para realizar un SELECT * FROM usuarios
export async function getAllUsers() {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT 
        id_usuario as id,
        username,
        password,
        n_departamento,
        admin,
        rut,
        nombre,
        apellido,
        correo,
        telefono,
        retiro_compartido
      FROM usuarios
    `);
    
    return result.rows;
  } catch (error) {
    console.error("Error al acceder a la base de datos:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para autenticar usuario
export async function authenticateUser(username: string, password: string) {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT 
        id_usuario as id,
        username,
        password,
        n_departamento,
        admin,
        rut,
        nombre,
        apellido,
        correo,
        telefono,
        retiro_compartido
      FROM usuarios 
      WHERE username = $1 AND password = $2
    `, [username, password]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0] as any;
      // No devolver la contraseña en la respuesta
      const { password: _, ...userWithoutPassword } = user;
      
      console.log("Usuario autenticado:", userWithoutPassword);
      console.log("Es admin:", user.admin);
      
      return {
        success: true,
        user: userWithoutPassword,
        redirectTo: user.admin === true ? "/admin" : "/residente"
      };
    }
    
    console.log("Credenciales inválidas para:", username);
    return {
      success: false,
      error: "Credenciales inválidas"
    };
  } catch (error) {
    console.error("Error al autenticar usuario:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Nueva función para obtener usuarios por departamento
export async function getUsersByDepartamento(departamento: string) {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT 
        id_usuario as id,
        username,
        n_departamento,
        admin,
        rut,
        nombre,
        apellido,
        correo,
        telefono,
        retiro_compartido
      FROM usuarios 
      WHERE n_departamento = $1
    `, [departamento]);
    
    return result.rows;
  } catch (error) {
    console.error("Error al obtener usuarios por departamento:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para registrar un nuevo paquete
export async function registrarPaquete(idDestinatario: number, ubicacion: string, fechaLimite: string | null) {
  const client = await getConnection();
  try {
    const fechaEntrega = new Date().toISOString();
    
    const result = await client.queryObject(`
      INSERT INTO paquetes (
        id_userdestinatario, 
        fecha_entrega, 
        fecha_limite, 
        ubicacion
      ) VALUES ($1, $2, $3, $4)
      RETURNING id_pack
    `, [idDestinatario, fechaEntrega, fechaLimite, ubicacion]);
    
    const paqueteId = (result.rows[0] as any).id_pack;
    
    // Obtener información del usuario destinatario para la notificación
    const userResult = await client.queryObject(`
      SELECT nombre FROM usuarios WHERE id_usuario = $1
    `, [idDestinatario]);
    
    const nombreUsuario = userResult.rows.length > 0 ? (userResult.rows[0] as any).nombre : "Usuario";
    
    return {
      success: true,
      paqueteId,
      fechaEntrega,
      nombreUsuario
    };
  } catch (error) {
    console.error("Error al registrar el paquete:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para crear una notificación asociada a un paquete
export async function crearNotificacion(idPaquete: number, nombreUsuario: string, fechaEntrega: string, descripcion: string | null) {
  const client = await getConnection();
  try {
    const fechaFormateada = new Date(fechaEntrega).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let mensaje = `${nombreUsuario} recibió un paquete el ${fechaFormateada}`;
    if (descripcion && descripcion.trim() !== '') {
      mensaje += `: ${descripcion}`;
    }
    
    const fechaEnvio = new Date().toISOString();
    
    await client.queryObject(`
      INSERT INTO notificaciones (
        id_pack,
        mensaje,
        fecha_envio,
        leido
      ) VALUES ($1, $2, $3, $4)
    `, [idPaquete, mensaje, fechaEnvio, false]);
    
    return {
      success: true,
      mensaje,
      fechaEnvio
    };
  } catch (error) {
    console.error("Error al crear la notificación:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para obtener todos los paquetes
export async function getAllPaquetes() {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT 
        p.id_pack as id,
        p.id_userdestinatario as idDestinatario,
        p.id_userretirador as idRetirador,
        p.fecha_entrega as fechaEntrega,
        p.fecha_limite as fechaLimite,
        p.fecha_retiro as fechaRetiro,
        p.ubicacion,
        u_dest.nombre as nombreDestinatario,
        u_dest.apellido as apellidoDestinatario,
        u_dest.n_departamento as departamento,
        u_ret.nombre as nombreRetirador,
        u_ret.apellido as apellidoRetirador
      FROM paquetes p
      LEFT JOIN usuarios u_dest ON p.id_userdestinatario = u_dest.id_usuario
      LEFT JOIN usuarios u_ret ON p.id_userretirador = u_ret.id_usuario
      ORDER BY p.fecha_entrega DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error("Error al obtener paquetes:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para obtener información de contacto del usuario
export async function getUsuarioContactInfo(idUsuario: number) {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT nombre, apellido, telefono
      FROM usuarios
      WHERE id_usuario = $1
    `, [idUsuario]);
    
    if (result.rows.length === 0) {
      return {
        success: false,
        error: "Usuario no encontrado"
      };
    }
    
    const userData = result.rows[0] as any;
    return {
      success: true,
      data: {
        nombre: userData.nombre,
        apellido: userData.apellido,
        telefono: userData.telefono
      }
    };
  } catch (error) {
    console.error("Error al obtener información de contacto:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para registrar un estado de notificación de WhatsApp
export async function registrarEstadoNotificacionWhatsApp(
  idPaquete: number,
  idUsuario: number,
  estado: string,
  mensajeId?: string
) {
  const client = await getConnection();
  try {
    const fechaCreacion = new Date().toISOString();
    
    await client.queryObject(`
      INSERT INTO notificacioneswhatsapp (
        id_paquete,
        id_usuario,
        estado,
        mensaje_id,
        fecha_creacion
      ) VALUES ($1, $2, $3, $4, $5)
    `, [idPaquete, idUsuario, estado, mensajeId || null, fechaCreacion]);
    
    return {
      success: true,
      fechaCreacion
    };
  } catch (error) {
    console.error("Error al registrar estado de notificación WhatsApp:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para actualizar el estado de una notificación de WhatsApp
export async function actualizarEstadoNotificacionWhatsApp(
  mensajeId: string,
  nuevoEstado: string
) {
  const client = await getConnection();
  try {
    const fechaActualizacion = new Date().toISOString();
    
    await client.queryObject(`
      UPDATE notificacioneswhatsapp
      SET estado = $1, fecha_actualizacion = $2
      WHERE mensaje_id = $3
    `, [nuevoEstado, fechaActualizacion, mensajeId]);
    
    return {
      success: true,
      fechaActualizacion
    };
  } catch (error) {
    console.error("Error al actualizar estado de notificación WhatsApp:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para crear usuario
export async function createUser(userData: {
  username: string;
  password: string;
  N_departamento: string;
  admin: number;
  rut: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  retiro_compartido: number;
}) {
  const client = await getConnection();
  try {
    // Verificar si el usuario ya existe
    const existingUser = await client.queryObject(`
      SELECT id_usuario FROM usuarios WHERE username = $1 OR rut = $2
    `, [userData.username, userData.rut]);
    
    if (existingUser.rows.length > 0) {
      throw new Error("Ya existe un usuario con ese nombre de usuario o RUT");
    }

    const result = await client.queryObject(`
      INSERT INTO usuarios (
        username, password, n_departamento, admin, rut, 
        nombre, apellido, correo, telefono, retiro_compartido
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      userData.username,
      userData.password,
      userData.N_departamento,
      userData.admin === 1,
      userData.rut,
      userData.nombre,
      userData.apellido,
      userData.correo,
      userData.telefono,
      userData.retiro_compartido === 1
    ]);

    const newUser = result.rows[0] as any;
    return {
      id: newUser.id_usuario,
      username: newUser.username,
      password: newUser.password,
      N_departamento: newUser.n_departamento,
      admin: newUser.admin,
      rut: newUser.rut,
      nombre: newUser.nombre,
      apellido: newUser.apellido,
      correo: newUser.correo,
      telefono: newUser.telefono,
      retiro_compartido: newUser.retiro_compartido
    };
  } catch (error) {
    console.error("Error al crear usuario:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para obtener paquetes de un residente específico
export async function getResidentPackages(residentId: number) {
  console.log("getResidentPackages llamada con ID:", residentId);
  const client = await getConnection();
  try {
    // Obtener información del residente
    const residentResult = await client.queryObject(`
      SELECT n_departamento, retiro_compartido FROM usuarios WHERE id_usuario = $1
    `, [residentId]);
    
    if (residentResult.rows.length === 0) {
      return { success: false, error: "Residente no encontrado" };
    }
    
    const residentInfo = residentResult.rows[0] as any;

    const result = await client.queryObject(`
  SELECT DISTINCT
    p.id_pack,
    p.id_userdestinatario,
    p.id_userretirador,
    p.fecha_entrega,
    p.fecha_limite,
    p.fecha_retiro,
    p.ubicacion,
    -- Agregar la expresión para ORDER BY
    CASE WHEN p.fecha_retiro IS NULL THEN 0 ELSE 1 END as orden_retiro,
    -- Información del destinatario
    u_dest.id_usuario as dest_id,
    u_dest.nombre as dest_nombre,
    u_dest.apellido as dest_apellido,
    u_dest.n_departamento as dest_departamento,
    u_dest.retiro_compartido as dest_retiro_compartido,
    -- Información del retirador
    u_ret.id_usuario as ret_id,
    u_ret.nombre as ret_nombre,
    u_ret.apellido as ret_apellido,
    u_ret.n_departamento as ret_departamento,
    u_ret.retiro_compartido as ret_retiro_compartido,
    -- Información de la notificación
    n.id_notificacion,
    n.mensaje,
    n.fecha_envio,
    n.leido
  FROM paquetes p
  INNER JOIN usuarios u_dest ON p.id_userdestinatario = u_dest.id_usuario
  LEFT JOIN usuarios u_ret ON p.id_userretirador = u_ret.id_usuario
  LEFT JOIN notificaciones n ON p.id_pack = n.id_pack
  WHERE
    -- Paquetes no retirados
    (p.fecha_retiro IS NULL AND (
      p.id_userdestinatario = $1 OR
      (u_dest.n_departamento = $2 AND u_dest.retiro_compartido = true)
    ))
    OR
    -- Paquetes ya retirados
    (p.fecha_retiro IS NOT NULL AND (
      p.id_userdestinatario = $1 OR
      p.id_userretirador = $1
    ))
  ORDER BY
    orden_retiro,
    p.fecha_entrega DESC
`, [residentId, residentInfo.n_departamento]);

    const packages = result.rows.map((row: any) => ({
      paquete: {
        ID_pack: row.id_pack,
        ID_userDestinatario: row.id_userdestinatario,
        ID_userRetirador: row.id_userretirador || undefined,
        fecha_entrega: row.fecha_entrega,
        fecha_limite: row.fecha_limite || undefined,
        fecha_retiro: row.fecha_retiro || undefined,
        ubicacion: row.ubicacion
      },
      destinatario: {
        ID_usuario: row.dest_id,
        nombre: row.dest_nombre,
        apellido: row.dest_apellido,
        N_departamento: row.dest_departamento,
        retiro_compartido: row.dest_retiro_compartido
      },
      retirador: row.ret_id ? {
        ID_usuario: row.ret_id,
        nombre: row.ret_nombre,
        apellido: row.ret_apellido,
        N_departamento: row.ret_departamento,
        retiro_compartido: row.ret_retiro_compartido
      } : undefined,
      notificacion: row.id_notificacion ? {
        ID_notificacion: row.id_notificacion,
        ID_pack: row.id_pack,
        mensaje: row.mensaje,
        fecha_envio: row.fecha_envio,
        leido: row.leido
      } : undefined
    }));

    console.log(`Encontrados ${packages.length} paquetes para el residente ${residentId}`);
    
    return {
      success: true,
      packages: packages
    };

  } catch (error) {
    console.error("Error al obtener paquetes del residente:", error.message);
    return {
      success: false,
      error: "Error al obtener paquetes"
    };
  } finally {
    await client.end();
  }
}

// Función para obtener paquetes próximos a vencer
export async function getPaquetesPorVencer(diasAntes: number = 3) {
  const client = await getConnection();
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAntes);
    
    console.log(`Buscando paquetes que vencen hasta: ${fechaLimite.toISOString().split('T')[0]}`);
    
    const result = await client.queryObject(`
      SELECT DISTINCT
        p.id_pack,
        p.id_userdestinatario,
        p.fecha_entrega,
        p.fecha_limite,
        p.ubicacion,
        u.nombre as nombre_destinatario,
        u.apellido as apellido_destinatario,
        u.n_departamento,
        u.telefono,
        CASE WHEN nw.estado = 'notificacion_vencimiento_enviada' THEN true ELSE false END as notificacion_vencimiento_enviada
      FROM paquetes p
      INNER JOIN usuarios u ON p.id_userdestinatario = u.id_usuario
      LEFT JOIN notificacioneswhatsapp nw ON p.id_pack = nw.id_paquete 
        AND nw.estado = 'notificacion_vencimiento_enviada'
      WHERE 
        p.fecha_retiro IS NULL
        AND p.fecha_limite IS NOT NULL
        AND p.fecha_limite::date <= $1::date
        AND p.fecha_limite::date >= CURRENT_DATE
        AND nw.id_notificacion IS NULL
      ORDER BY p.fecha_limite ASC
    `, [fechaLimite.toISOString()]);
    
    console.log(`Encontrados ${result.rows.length} paquetes próximos a vencer`);
    
    return result.rows.map((row: any) => ({
      ID_pack: row.id_pack,
      ID_userDestinatario: row.id_userdestinatario,
      fecha_entrega: row.fecha_entrega,
      fecha_limite: row.fecha_limite,
      ubicacion: row.ubicacion,
      nombre_destinatario: row.nombre_destinatario,
      apellido_destinatario: row.apellido_destinatario,
      N_departamento: row.n_departamento,
      telefono: row.telefono,
      notificacion_vencimiento_enviada: row.notificacion_vencimiento_enviada
    }));
  } catch (error) {
    console.error("Error al obtener paquetes por vencer:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para obtener paquetes pendientes
export async function getPaquetesPendientes() {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT 
        p.id_pack as id,
        p.id_userdestinatario as idDestinatario,
        p.id_userretirador as idRetirador,
        p.fecha_entrega as fechaEntrega,
        p.fecha_limite as fechaLimite,
        p.fecha_retiro as fechaRetiro,
        p.ubicacion,
        u_dest.nombre as nombreDestinatario,
        u_dest.apellido as apellidoDestinatario,
        u_dest.n_departamento as departamento,
        u_ret.nombre as nombreRetirador,
        u_ret.apellido as apellidoRetirador
      FROM paquetes p
      LEFT JOIN usuarios u_dest ON p.id_userdestinatario = u_dest.id_usuario
      LEFT JOIN usuarios u_ret ON p.id_userretirador = u_ret.id_usuario
      WHERE p.fecha_retiro IS NULL
      ORDER BY p.fecha_entrega DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error("Error al obtener paquetes pendientes:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para obtener estadísticas de paquetes
export async function getEstadisticasPaquetes() {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN fecha_retiro IS NULL THEN 1 END) as pendientes,
        COUNT(CASE WHEN fecha_retiro IS NOT NULL THEN 1 END) as retirados,
        COUNT(CASE 
          WHEN fecha_retiro IS NULL 
          AND fecha_limite < NOW() 
          THEN 1 
        END) as vencidos
      FROM paquetes
    `);
    
    const row = result.rows[0] as any;
    
    return {
      total: parseInt(row.total) || 0,
      pendientes: parseInt(row.pendientes) || 0,
      retirados: parseInt(row.retirados) || 0,
      vencidos: parseInt(row.vencidos) || 0
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de paquetes:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para retirar paquete
export async function retirarPaquete(packageId: number, userId: number) {
  const client = await getConnection();
  try {
    // Verificar que el paquete existe y no ha sido retirado
    const checkResult = await client.queryObject(`
      SELECT id_pack, fecha_retiro 
      FROM paquetes 
      WHERE id_pack = $1
    `, [packageId]);
    
    if (checkResult.rows.length === 0) {
      throw new Error("Paquete no encontrado");
    }
    
    const paqueteExistente = checkResult.rows[0] as any;
    if (paqueteExistente.fecha_retiro !== null) {
      throw new Error("El paquete ya ha sido retirado");
    }

    const fechaActual = new Date().toISOString();

    // Actualizar el paquete
    await client.queryObject(`
      UPDATE paquetes 
      SET id_userretirador = $1, fecha_retiro = $2
      WHERE id_pack = $3
    `, [userId, fechaActual, packageId]);
    
    // Obtener información actualizada
    const infoResult = await client.queryObject(`
      SELECT 
        p.id_pack as id,
        p.id_userdestinatario as idDestinatario,
        p.id_userretirador as idRetirador,
        p.fecha_entrega as fechaEntrega,
        p.fecha_limite as fechaLimite,
        p.fecha_retiro as fechaRetiro,
        p.ubicacion,
        u_dest.nombre as nombreDestinatario,
        u_dest.apellido as apellidoDestinatario,
        u_ret.nombre as nombreRetirador,
        u_ret.apellido as apellidoRetirador
      FROM paquetes p
      LEFT JOIN usuarios u_dest ON p.id_userdestinatario = u_dest.id_usuario
      LEFT JOIN usuarios u_ret ON p.id_userretirador = u_ret.id_usuario
      WHERE p.id_pack = $1
    `, [packageId]);
    
    if (infoResult.rows.length > 0) {
      return infoResult.rows[0];
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error al retirar paquete:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para obtener todos los reclamos
export async function getAllReclamos() {
  const client = await getConnection();
  try {
    const result = await client.queryObject(`
      SELECT
        r.id_reclamo as id,
        r.id_usuario as idUsuario,
        r.id_pack as idPack,
        r.descripcion,
        r.status as estado,
        u.nombre as nombreResidente,
        u.apellido as apellidoResidente,
        u.n_departamento as departamento
      FROM reclamos r
      LEFT JOIN usuarios u ON r.id_usuario = u.id_usuario
    `);
   
    return result.rows;
  } catch (error) {
    console.error("Error al obtener reclamos:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para generar código QR para retiro de paquete
export async function generarCodigoQRRetiro(paqueteId: number, residenteId: number) {
  const client = await getConnection();
  try {
    // Verificar paquete
    const verificarResult = await client.queryObject(`
      SELECT p.*, u.nombre, u.n_departamento
      FROM paquetes p
      JOIN usuarios u ON p.id_userdestinatario = u.id_usuario
      WHERE p.id_pack = $1 AND p.id_userdestinatario = $2 AND p.fecha_retiro IS NULL
    `, [paqueteId, residenteId]);
    
    if (verificarResult.rows.length === 0) {
      throw new Error("Paquete no encontrado o ya retirado");
    }
    
    // Generar código QR único
    const codigoQR = crypto.randomUUID();
    const fechaGeneracion = new Date().toISOString();
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    await client.queryObject(`
      INSERT INTO codigosqr (
        codigo_qr,
        id_paquete,
        id_residente,
        fecha_generacion,
        fecha_expiracion,
        estado
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [codigoQR, paqueteId, residenteId, fechaGeneracion, fechaExpiracion, 'activo']);
    
    const paquete = verificarResult.rows[0] as any;
    
    return {
      success: true,
      codigoQR,
      paqueteInfo: {
        id: paquete.id_pack,
        residente: paquete.nombre,
        departamento: paquete.n_departamento,
        fechaEntrega: paquete.fecha_entrega,
        ubicacion: paquete.ubicacion
      },
      fechaExpiracion
    };
  } catch (error) {
    console.error("Error al generar código QR:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para validar y procesar escaneo de QR
export async function procesarEscaneoQR(codigoQR: string, adminId: number) {
  const client = await getConnection();
  try {
    // Buscar el código QR y obtener información del paquete
    // CAMBIO: Eliminamos el JOIN con admin y agregamos JOIN con el usuario retirador
    const buscarQRQuery = `
      SELECT 
        qr.*,
        p.*,
        u_destinatario.nombre as nombre_destinatario,
        u_destinatario.n_departamento,
        u_destinatario.telefono,
        u_retirador.nombre as nombre_retirador
      FROM codigosqr qr
      JOIN paquetes p ON qr.id_paquete = p.id_pack
      JOIN usuarios u_destinatario ON p.id_userdestinatario = u_destinatario.id_usuario
      JOIN usuarios u_retirador ON qr.id_residente = u_retirador.id_usuario
      WHERE qr.codigo_qr = $1 AND qr.estado = 'activo'
    `;
    
    const qrResult = await client.queryObject(buscarQRQuery, [codigoQR]);
    const qrData = qrResult.rows;
    
    if (qrData.length === 0) {
      return {
        success: false,
        error: "Código QR no válido o ya utilizado"
      };
    }
    
    const data = qrData[0];
    const fechaActual = new Date().toISOString();
    
    console.log("Datos del QR procesado:");
    console.log("ID QR:", data.id_qr);
    console.log("Código QR:", data.codigo_qr);
    console.log("ID Paquete:", data.id_paquete);
    console.log("ID Residente (quien retira):", data.id_residente);
    console.log("ID Pack (desde tabla paquetes):", data.id_pack);
    console.log("Nombre destinatario:", data.nombre_destinatario);
    console.log("Nombre retirador:", data.nombre_retirador);
    console.log("Fecha entrega:", data.fecha_entrega);
    console.log("Fecha retiro:", data.fecha_retiro);
    console.log("================================");

    // Verificar si el código QR ha expirado
    if (new Date() > new Date(data.fecha_expiracion)) {
      return {
        success: false,
        error: "Código QR expirado"
      };
    }
    
    // Verificar si el paquete ya fue retirado
    if (data.fecha_retiro !== null) {
      return {
        success: false,
        error: "Este paquete ya fue retirado"
      };
    }
    
    // CAMBIO: Actualizar el paquete como retirado con el ID del usuario que generó el QR
    const retirarQuery = `
      UPDATE paquetes 
      SET fecha_retiro = $1, id_userretirador = $2
      WHERE id_pack = $3
    `;
    
    await client.queryObject(retirarQuery, [fechaActual, data.id_residente, data.id_pack]);
    
    // Marcar el código QR como utilizado
    const actualizarQRQuery = `
      UPDATE codigosqr 
      SET estado = 'utilizado', fecha_uso = $1
      WHERE codigo_qr = $2
    `;
    
    await client.queryObject(actualizarQRQuery, [fechaActual, codigoQR]);
    
    return {
      success: true,
      paqueteInfo: {
        ID_pack: data.id_pack,
        destinatario: data.nombre_destinatario,
        departamento: data.n_departamento,
        telefono: data.telefono,
        fechaEntrega: data.fecha_entrega,
        ubicacion: data.ubicacion,
        fechaRetiro: fechaActual,
        userRetirador: data.nombre_retirador
      }
    };
    
  } catch (error) {
    console.error("Error al procesar escaneo QR:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para limpiar códigos QR expirados
export async function limpiarCodigosQRExpirados() {
  const client = await getConnection();
  try {
    const fechaActual = new Date().toISOString();
    
    const updateQuery = `
      UPDATE codigos_qr 
      SET estado = 'expirado'
      WHERE fecha_expiracion < $1 AND estado = 'activo'
    `;
    
    const result = await client.queryObject(updateQuery, [fechaActual]);
    
    return {
      success: true,
      codigosExpirados: result.rowCount || 0
    };
  } catch (error) {
    console.error("Error al limpiar códigos QR expirados:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para actualizar estado de reclamo
export async function updateReclamoStatus(idReclamo: number, nuevoEstado: string) {
  const client = await getConnection();
  try {
    const query = `
      UPDATE reclamos 
      SET status = $1 
      WHERE id_reclamo = $2
    `;
    
    await client.queryObject(query, [nuevoEstado, idReclamo]);
    
    // Verificar que se actualizó correctamente
    const verificarQuery = `
      SELECT * FROM reclamos WHERE id_reclamo = $1
    `;
    
    const result = await client.queryObject(verificarQuery, [idReclamo]);
    
    if (result.rows.length === 0) {
      throw new Error("Reclamo no encontrado");
    }
    
    const reclamo = result.rows[0];
    return {
      id: reclamo.id_reclamo,
      idUsuario: reclamo.id_usuario,
      idPack: reclamo.id_pack,
      descripcion: reclamo.descripcion,
      status: reclamo.status
    };
  } catch (error) {
    console.error("Error al actualizar estado del reclamo:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para crear un reclamo
export async function crearReclamo(idUsuario: number, idPack: number, descripcion: string) {
  const client = await getConnection();
  try {
    const query = `
      INSERT INTO reclamos (id_usuario, id_pack, descripcion, status)
      VALUES ($1, $2, $3, 'pendiente')
      RETURNING id_reclamo
    `;
    
    const result = await client.queryObject(query, [idUsuario, idPack, descripcion]);
    const reclamoId = result.rows[0].id_reclamo;
    
    return {
      id: reclamoId,
      idUsuario,
      idPack,
      descripcion,
      status: 'pendiente'
    };
  } catch (error) {
    console.error("Error al crear reclamo:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Función para testear la conexión
export async function testConnection() {
  try {
    const client = await getConnection();
    const result = await client.queryObject("SELECT version()");
    console.log("Conexión exitosa. Versión de PostgreSQL:", result.rows[0]);
    await client.end();
    return { success: true, message: "Conexión exitosa" };
  } catch (error) {
    console.error("Error al testear conexión:", error);
    return { success: false, error: error.message };
  }
}