// app/db/statements.ts
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { v4 } from "https://deno.land/std@0.81.0/uuid/mod.ts";
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

// Nueva función para obtener usuarios por departamento
export function getUsersByDepartamento(departamento: string) {
  const db = new DB(dbPath);
  try {
    const query = "SELECT * FROM Usuarios WHERE N_departamento = ?";
    const rows = db.query(query, [departamento]);
    
    const users = Array.from(rows, (row) => ({
      id: row[0],
      username: row[1],
      password: row[2],
      N_departamento: row[3],
      admin: row[4] === 1,
      rut: row[5],
      nombre: row[6],
      apellido: row[7],
      correo: row[8],
      telefono: row[9],
      retiro_compartido: row[10] === 1
    }));
    
    // Retornar solo los datos necesarios, sin contraseñas
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  } catch (error) {
    console.error("Error al obtener usuarios por departamento:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para registrar un nuevo paquete
export function registrarPaquete(idDestinatario: number, ubicacion: string, fechaLimite: string | null) {
  const db = new DB(dbPath);
  try {
    // Obtener la fecha actual para fecha_entrega
    const fechaEntrega = new Date().toISOString();
    
    // Preparar consulta SQL con parámetros
    const query = `
      INSERT INTO Paquetes (
        ID_userDestinatario, 
        fecha_entrega, 
        fecha_limite, 
        ubicacion
      ) VALUES (?, ?, ?, ?)
    `;
    
    // Ejecutar la consulta con los valores
    const result = db.query(query, [
      idDestinatario,
      fechaEntrega,
      fechaLimite, // Puede ser null
      ubicacion
    ]);
    
    // Obtener el ID del paquete recién insertado
    const lastIdQuery = "SELECT last_insert_rowid()";
    const lastIdResult = db.query(lastIdQuery);
    const paqueteId = Array.from(lastIdResult)[0][0] as number;
    
    // Obtener información del usuario destinatario para la notificación
    const userQuery = "SELECT nombre FROM Usuarios WHERE ID_usuario = ?";
    const userResult = db.query(userQuery, [idDestinatario]);
    const userData = Array.from(userResult);
    const nombreUsuario = userData.length > 0 ? userData[0][0] as string : "Usuario";
    
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
    db.close();
  }
}

// Función para crear una notificación asociada a un paquete
export function crearNotificacion(idPaquete: number, nombreUsuario: string, fechaEntrega: string, descripcion: string | null) {
  const db = new DB(dbPath);
  try {
    // Formatear la fecha para el mensaje
    const fechaFormateada = new Date(fechaEntrega).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Construir el mensaje de la notificación
    let mensaje = `${nombreUsuario} recibió un paquete el ${fechaFormateada}`;
    if (descripcion && descripcion.trim() !== '') {
      mensaje += `: ${descripcion}`;
    }
    
    // Fecha actual para el envío de la notificación
    const fechaEnvio = new Date().toISOString();
    
    // Insertar la notificación
    const query = `
      INSERT INTO Notificaciones (
        ID_pack,
        mensaje,
        fecha_envio,
        leido
      ) VALUES (?, ?, ?, 0)
    `;
    
    db.query(query, [idPaquete, mensaje, fechaEnvio]);
    
    return {
      success: true,
      mensaje,
      fechaEnvio
    };
  } catch (error) {
    console.error("Error al crear la notificación:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para obtener todos los paquetes (útil para el panel de administración)
export function getAllPaquetes() {
  const db = new DB(dbPath);
  try {
    const query = `
      SELECT 
        p.*,
        u_dest.nombre as nombre_destinatario,
        u_dest.apellido as apellido_destinatario,
        u_dest.N_departamento as departamento_destinatario,
        u_ret.nombre as nombre_retirador,
        u_ret.apellido as apellido_retirador
      FROM Paquetes p
      LEFT JOIN Usuarios u_dest ON p.ID_userDestinatario = u_dest.ID_usuario
      LEFT JOIN Usuarios u_ret ON p.ID_userRetirador = u_ret.ID_usuario
      ORDER BY p.fecha_entrega DESC
    `;
    
    const rows = db.query(query);
    
    const paquetes = Array.from(rows, (row) => ({
      id: row[0],
      idDestinatario: row[1],
      idRetirador: row[2],
      fechaEntrega: row[3],
      fechaLimite: row[4],
      fechaRetiro: row[5],
      ubicacion: row[6],
      nombreDestinatario: row[7],
      apellidoDestinatario: row[8],
      departamento: row[9],
      nombreRetirador: row[10],
      apellidoRetirador: row[11]
    }));
    
    return paquetes;
  } catch (error) {
    console.error("Error al obtener paquetes:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para obtener el teléfono y nombre del usuario por ID
export function getUsuarioContactInfo(idUsuario: number) {
  const db = new DB(dbPath);
  try {
    const query = `
      SELECT nombre, apellido, telefono
      FROM Usuarios
      WHERE ID_usuario = ?
    `;
    
    const result = db.query(query, [idUsuario]);
    const userData = Array.from(result);
    
    if (userData.length === 0) {
      return {
        success: false,
        error: "Usuario no encontrado"
      };
    }
    
    return {
      success: true,
      data: {
        nombre: userData[0][0] as string,
        apellido: userData[0][1] as string,
        telefono: userData[0][2] as string
      }
    };
  } catch (error) {
    console.error("Error al obtener información de contacto:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para registrar un estado de notificación de WhatsApp
export function registrarEstadoNotificacionWhatsApp(
  idPaquete: number,
  idUsuario: number,
  estado: string,
  mensajeId?: string
) {
  const db = new DB(dbPath);
  try {
    const query = `
      INSERT INTO NotificacionesWhatsApp (
        ID_paquete,
        ID_usuario,
        estado,
        mensaje_id,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?)
    `;
    
    const fechaCreacion = new Date().toISOString();
    
    db.query(query, [
      idPaquete,
      idUsuario,
      estado,
      mensajeId || null,
      fechaCreacion
    ]);
    
    return {
      success: true,
      fechaCreacion
    };
  } catch (error) {
    console.error("Error al registrar estado de notificación WhatsApp:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para actualizar el estado de una notificación de WhatsApp
export function actualizarEstadoNotificacionWhatsApp(
  mensajeId: string,
  nuevoEstado: string
) {
  const db = new DB(dbPath);
  try {
    const query = `
      UPDATE NotificacionesWhatsApp
      SET estado = ?, fecha_actualizacion = ?
      WHERE mensaje_id = ?
    `;
    
    const fechaActualizacion = new Date().toISOString();
    
    db.query(query, [
      nuevoEstado,
      fechaActualizacion,
      mensajeId
    ]);
    
    return {
      success: true,
      fechaActualizacion
    };
  } catch (error) {
    console.error("Error al actualizar estado de notificación WhatsApp:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

export function createUser(userData: {
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
  const db = new DB(dbPath);
  try {
    // Verificar si el usuario ya existe (por username o rut)
    const existingUser = db.query(
      "SELECT ID_usuario FROM Usuarios WHERE username = ? OR rut = ?",
      [userData.username, userData.rut]
    );
    
    if (existingUser.length > 0) {
      throw new Error("Ya existe un usuario con ese nombre de usuario o RUT");
    }

    // Insertar el nuevo usuario
    const result = db.query(`
      INSERT INTO Usuarios (
        username, password, N_departamento, admin, rut, 
        nombre, apellido, correo, telefono, reitro_compartido
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userData.username,
      userData.password,
      userData.N_departamento,
      userData.admin,
      userData.rut,
      userData.nombre,
      userData.apellido,
      userData.correo,
      userData.telefono,
      userData.retiro_compartido
    ]);

    // Obtener el ID del usuario recién creado
    const newUserId = db.query("SELECT last_insert_rowid() as ID_usuario")[0][0];

    // Retornar el usuario creado
    const newUser = db.query("SELECT * FROM Usuarios WHERE ID_usuario = ?", [newUserId]);
    
    return {
      id: newUser[0][0],
      username: newUser[0][1],
      password: newUser[0][2],
      N_departamento: newUser[0][3],
      admin: newUser[0][4],
      rut: newUser[0][5],
      nombre: newUser[0][6],
      apellido: newUser[0][7],
      correo: newUser[0][8],
      telefono: newUser[0][9],
      retiro_compartido: newUser[0][10]
    };
  } catch (error) {
    console.error("Error al crear usuario:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para obtener paquetes de un residente específico
export function getResidentPackages(residentId: number) {
  console.log("getResidentPackages llamada con ID:", residentId);
  const db = new DB(dbPath);
  try {
    // Primero obtenemos la información del residente actual
    const residentQuery = "SELECT N_departamento, reitro_compartido FROM Usuarios WHERE ID_usuario = ?";
    const residentRows = db.query(residentQuery, [residentId]);
    
    if (residentRows.length === 0) {
      return { success: false, error: "Residente no encontrado" };
    }
    
    const residentInfo = {
      departamento: residentRows[0][0],
      retiro_compartido: residentRows[0][1] === 1
    };

    // Query compleja para obtener paquetes según las reglas de negocio
    const packagesQuery = `
      SELECT DISTINCT
        p.ID_pack,
        p.ID_userDestinatario,
        p.ID_userRetirador,
        p.fecha_entrega,
        p.fecha_limite,
        p.fecha_retiro,
        p.ubicacion,
        -- Información del destinatario
        u_dest.ID_usuario as dest_id,
        u_dest.nombre as dest_nombre,
        u_dest.apellido as dest_apellido,
        u_dest.N_departamento as dest_departamento,
        u_dest.reitro_compartido as dest_retiro_compartido,
        -- Información del retirador (si existe)
        u_ret.ID_usuario as ret_id,
        u_ret.nombre as ret_nombre,
        u_ret.apellido as ret_apellido,
        u_ret.N_departamento as ret_departamento,
        u_ret.reitro_compartido as ret_retiro_compartido,
        -- Información de la notificación
        n.ID_notificacion,
        n.mensaje,
        n.fecha_envio,
        n.leido
      FROM Paquetes p
      INNER JOIN Usuarios u_dest ON p.ID_userDestinatario = u_dest.ID_usuario
      LEFT JOIN Usuarios u_ret ON p.ID_userRetirador = u_ret.ID_usuario
      LEFT JOIN Notificaciones n ON p.ID_pack = n.ID_pack
      WHERE 
        -- Caso 1: Paquetes no retirados
        (p.fecha_retiro IS NULL AND (
          -- El residente es el destinatario
          p.ID_userDestinatario = ? OR
          -- O el destinatario es del mismo departamento Y tiene retiro_compartido activo
          (u_dest.N_departamento = ? AND u_dest.reitro_compartido = 1)
        ))
        OR
        -- Caso 2: Paquetes ya retirados
        (p.fecha_retiro IS NOT NULL AND (
          -- El residente es el destinatario
          p.ID_userDestinatario = ? OR
          -- O el residente hizo el retiro
          p.ID_userRetirador = ?
        ))
      ORDER BY 
        CASE WHEN p.fecha_retiro IS NULL THEN 0 ELSE 1 END,
        p.fecha_entrega DESC
    `;

    const rows = db.query(packagesQuery, [
      residentId, // Para paquetes no retirados - destinatario
      residentInfo.departamento, // Para paquetes no retirados - mismo departamento
      residentId, // Para paquetes retirados - destinatario
      residentId  // Para paquetes retirados - retirador
    ]);

    // Convertir resultados a objetos
    const packages = Array.from(rows, (row) => ({
      paquete: {
        ID_pack: row[0],
        ID_userDestinatario: row[1],
        ID_userRetirador: row[2] || undefined,
        fecha_entrega: row[3],
        fecha_limite: row[4] || undefined,
        fecha_retiro: row[5] || undefined,
        ubicacion: row[6]
      },
      destinatario: {
        ID_usuario: row[7],
        nombre: row[8],
        apellido: row[9],
        N_departamento: row[10],
        retiro_compartido: row[11] === 1
      },
      retirador: row[12] ? {
        ID_usuario: row[12],
        nombre: row[13],
        apellido: row[14],
        N_departamento: row[15],
        retiro_compartido: row[16] === 1
      } : undefined,
      notificacion: row[17] ? {
        ID_notificacion: row[17],
        ID_pack: row[0],
        mensaje: row[18],
        fecha_envio: row[19],
        leido: row[20] === 1
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
    db.close();
  }
}

// Función para obtener paquetes que están próximos a vencer
export function getPaquetesPorVencer(diasAntes: number = 3) {
  const db = new DB(dbPath);
  try {
    // Calcular la fecha límite para la búsqueda
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasAntes);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0]; // Solo la parte de fecha YYYY-MM-DD
    
    console.log(`Buscando paquetes que vencen hasta: ${fechaLimiteStr}`);
    
    const query = `
      SELECT DISTINCT
        p.ID_pack,
        p.ID_userDestinatario,
        p.fecha_entrega,
        p.fecha_limite,
        p.ubicacion,
        -- Información del destinatario
        u.nombre as nombre_destinatario,
        u.apellido as apellido_destinatario,
        u.N_departamento,
        u.telefono,
        -- Verificar si ya se envió notificación de vencimiento
        CASE WHEN nw.estado = 'notificacion_vencimiento_enviada' THEN 1 ELSE 0 END as notificacion_vencimiento_enviada
      FROM Paquetes p
      INNER JOIN Usuarios u ON p.ID_userDestinatario = u.ID_usuario
      LEFT JOIN NotificacionesWhatsApp nw ON p.ID_pack = nw.ID_paquete 
        AND nw.estado = 'notificacion_vencimiento_enviada'
      WHERE 
        -- Solo paquetes no retirados
        p.fecha_retiro IS NULL
        -- Que tengan fecha límite establecida
        AND p.fecha_limite IS NOT NULL
        AND p.fecha_limite != ''
        -- Que la fecha límite sea dentro de los próximos N días
        AND DATE(p.fecha_limite) <= DATE(?)
        -- Que la fecha límite no haya pasado ya (opcional, depende de tu lógica)
        AND DATE(p.fecha_limite) >= DATE('now')
        -- No se ha enviado notificación de vencimiento aún
        AND nw.ID_notificacion IS NULL
      ORDER BY p.fecha_limite ASC
    `;
    
    const rows = db.query(query, [fechaLimiteStr]);
    
    const paquetes = Array.from(rows, (row) => ({
      ID_pack: row[0],
      ID_userDestinatario: row[1],
      fecha_entrega: row[2],
      fecha_limite: row[3],
      ubicacion: row[4],
      nombre_destinatario: row[5],
      apellido_destinatario: row[6],
      N_departamento: row[7],
      telefono: row[8],
      notificacion_vencimiento_enviada: row[9] === 1
    }));
    
    console.log(`Encontrados ${paquetes.length} paquetes próximos a vencer`);
    
    return paquetes;
  } catch (error) {
    console.error("Error al obtener paquetes por vencer:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para obtener paquetes pendientes (sin retirar)
export function getPaquetesPendientes() {
  const db = new DB(dbPath);
  try {
    const query = `
      SELECT 
        p.*,
        u_dest.nombre as nombre_destinatario,
        u_dest.apellido as apellido_destinatario,
        u_dest.N_departamento as departamento_destinatario,
        u_ret.nombre as nombre_retirador,
        u_ret.apellido as apellido_retirador
      FROM Paquetes p
      LEFT JOIN Usuarios u_dest ON p.ID_userDestinatario = u_dest.ID_usuario
      LEFT JOIN Usuarios u_ret ON p.ID_userRetirador = u_ret.ID_usuario
      WHERE p.fecha_retiro IS NULL
      ORDER BY p.fecha_entrega DESC
    `;
    
    const rows = db.query(query);
    
    const paquetes = Array.from(rows, (row) => ({
      id: row[0],
      idDestinatario: row[1],
      idRetirador: row[2],
      fechaEntrega: row[3],
      fechaLimite: row[4],
      fechaRetiro: row[5],
      ubicacion: row[6],
      nombreDestinatario: row[7],
      apellidoDestinatario: row[8],
      departamento: row[9],
      nombreRetirador: row[10],
      apellidoRetirador: row[11]
    }));
    
    return paquetes;
  } catch (error) {
    console.error("Error al obtener paquetes pendientes:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para obtener estadísticas de paquetes
export function getEstadisticasPaquetes() {
  const db = new DB(dbPath);
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN fecha_retiro IS NULL THEN 1 END) as pendientes,
        COUNT(CASE WHEN fecha_retiro IS NOT NULL THEN 1 END) as retirados,
        COUNT(CASE 
          WHEN fecha_retiro IS NULL 
          AND fecha_limite < datetime('now') 
          THEN 1 
        END) as vencidos
      FROM Paquetes
    `;
    
    const result = db.query(query);
    const row = result[0];
    
    return {
      total: row[0] || 0,
      pendientes: row[1] || 0,
      retirados: row[2] || 0,
      vencidos: row[3] || 0
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de paquetes:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para retirar paquete
export function retirarPaquete(packageId: number, userId: number) {
  const db = new DB(dbPath);
  try {
    // Verificar que el paquete existe y no ha sido retirado
    const checkQuery = `
      SELECT ID_pack, fecha_retiro 
      FROM Paquetes 
      WHERE ID_pack = ?
    `;
    
    const paqueteExistente = db.query(checkQuery, [packageId]);
    
    if (paqueteExistente.length === 0) {
      throw new Error("Paquete no encontrado");
    }
    
    if (paqueteExistente[0][1] !== null) {
      throw new Error("El paquete ya ha sido retirado");
    }

    // Actualizar el paquete con la información de retiro
    const updateQuery = `
      UPDATE Paquetes 
      SET ID_userRetirador = ?, fecha_retiro = datetime('now')
      WHERE ID_pack = ?
    `;
    
    db.query(updateQuery, [userId, packageId]);
    
    // Obtener información actualizada del paquete
    const infoQuery = `
      SELECT 
        p.*,
        u_dest.nombre as nombre_destinatario,
        u_dest.apellido as apellido_destinatario,
        u_ret.nombre as nombre_retirador,
        u_ret.apellido as apellido_retirador
      FROM Paquetes p
      LEFT JOIN Usuarios u_dest ON p.ID_userDestinatario = u_dest.ID_usuario
      LEFT JOIN Usuarios u_ret ON p.ID_userRetirador = u_ret.ID_usuario
      WHERE p.ID_pack = ?
    `;
    
    const paqueteInfo = db.query(infoQuery, [packageId]);
    
    if (paqueteInfo.length > 0) {
      const row = paqueteInfo[0];
      return {
        id: row[0],
        idDestinatario: row[1],
        idRetirador: row[2],
        fechaEntrega: row[3],
        fechaLimite: row[4],
        fechaRetiro: row[5],
        ubicacion: row[6],
        nombreDestinatario: row[7],
        apellidoDestinatario: row[8],
        nombreRetirador: row[9],
        apellidoRetirador: row[10]
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error al retirar paquete:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función extensible para reclamos (ejemplo)
export function getAllReclamos() {
  const db = new DB(dbPath);
  try {
    // Asumir que existe una tabla Reclamos
    const query = `
      SELECT 
        r.*,
        u.nombre as nombre_residente,
        u.apellido as apellido_residente,
        u.N_departamento as departamento
      FROM Reclamos r
      LEFT JOIN Usuarios u ON r.ID_usuario = u.ID_usuario
    `;
    
    const rows = db.query(query);
    
    const reclamos = Array.from(rows, (row) => ({
      id: row[0],
      idUsuario: row[1],
      tipo: row[2],
      descripcion: row[3],
      estado: row[4],
      fechaCreacion: row[5],
      fechaResolucion: row[6],
      nombreResidente: row[7],
      apellidoResidente: row[8],
      departamento: row[9]
    }));
    
    return reclamos;
  } catch (error) {
    console.error("Error al obtener reclamos:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para generar código QR para retiro de paquete
export function generarCodigoQRRetiro(paqueteId: number, residenteId: number) {
  const db = new DB(dbPath);
  try {
    // Verificar que el paquete existe y pertenece al residente
    const verificarQuery = `
      SELECT p.*, u.nombre, u.N_departamento
      FROM Paquetes p
      JOIN Usuarios u ON p.ID_userDestinatario = u.ID_usuario
      WHERE p.ID_pack = ? AND p.ID_userDestinatario = ? AND p.fecha_retiro IS NULL
    `;
    
    const paqueteResult = db.query(verificarQuery, [paqueteId, residenteId]);
    const paqueteData = Array.from(paqueteResult);
    
    if (paqueteData.length === 0) {
      throw new Error("Paquete no encontrado o ya retirado");
    }
    
    // Generar código QR único
    const codigoQR = v4.generate();
    const fechaGeneracion = new Date().toISOString();
    const fechaExpiracion = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas
    
    // Insertar código QR en la tabla (necesitarás crear esta tabla)
    const insertQRQuery = `
      INSERT INTO CodigosQR (
        codigo_qr,
        ID_paquete,
        ID_residente,
        fecha_generacion,
        fecha_expiracion,
        estado
      ) VALUES (?, ?, ?, ?, ?, 'activo')
    `;
    
    db.query(insertQRQuery, [
      codigoQR,
      paqueteId,
      residenteId,
      fechaGeneracion,
      fechaExpiracion
    ]);
    
    const paquete = paqueteData[0];
    
    return {
      success: true,
      codigoQR,
      paqueteInfo: {
        id: paquete[0],
        residente: paquete[6],
        departamento: paquete[7],
        fechaEntrega: paquete[2],
        ubicacion: paquete[4]
      },
      fechaExpiracion
    };
  } catch (error) {
    console.error("Error al generar código QR:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para validar y procesar escaneo de QR
export function procesarEscaneoQR(codigoQR: string, adminId: number) {
  const db = new DB(dbPath);
  try {
    // Buscar el código QR y obtener información del paquete
    // CAMBIO: Eliminamos el JOIN con admin y agregamos JOIN con el usuario retirador
    const buscarQRQuery = `
      SELECT 
        qr.*,
        p.*,
        u_destinatario.nombre as nombre_destinatario,
        u_destinatario.N_departamento,
        u_destinatario.telefono,
        u_retirador.nombre as nombre_retirador
      FROM CodigosQR qr
      JOIN Paquetes p ON qr.ID_paquete = p.ID_pack
      JOIN Usuarios u_destinatario ON p.ID_userDestinatario = u_destinatario.ID_usuario
      JOIN Usuarios u_retirador ON qr.ID_residente = u_retirador.ID_usuario
      WHERE qr.codigo_qr = ? AND qr.estado = 'activo'
    `;
    
    const qrResult = db.query(buscarQRQuery, [codigoQR]);
    const qrData = Array.from(qrResult);
    
    if (qrData.length === 0) {
      return {
        success: false,
        error: "Código QR no válido o ya utilizado"
      };
    }
    
    const data = qrData[0];
    const fechaActual = new Date().toISOString();
    
    console.log("Datos del QR procesado:");
    console.log("ID QR:", data[0]);
    console.log("Código QR:", data[1]);
    console.log("ID Paquete:", data[2]);
    console.log("ID Residente (quien retira):", data[3]);
    console.log("ID Pack (desde tabla paquetes):", data[8]);
    console.log("Nombre destinatario:", data[15]);
    console.log("Nombre retirador:", data[18]);
    console.log("Fecha entrega:", data[11]);
    console.log("Fecha retiro:", data[13]);
    console.log("================================");
    console.log("data: " + qrData)

    // Verificar si el código QR ha expirado
    if (new Date() > new Date(data[5])) { // data[5] es fecha_expiracion
      return {
        success: false,
        error: "Código QR expirado"
      };
    }
    
    // Verificar si el paquete ya fue retirado
    if (data[13] !== null) { // data[12] es fecha_retiro
      return {
        success: false,
        error: "Este paquete ya fue retirado"
      };
    }
    
    // CAMBIO: Actualizar el paquete como retirado con el ID del usuario que generó el QR
    const retirarQuery = `
      UPDATE Paquetes 
      SET fecha_retiro = ?, ID_userRetirador = ?
      WHERE ID_pack = ?
    `;
    
    db.query(retirarQuery, [fechaActual, data[3], data[8]]); // data[3] es ID_residente (quien retira)
    
    // Marcar el código QR como utilizado
    const actualizarQRQuery = `
      UPDATE CodigosQR 
      SET estado = 'utilizado', fecha_uso = ?
      WHERE codigo_qr = ?
    `;
    
    db.query(actualizarQRQuery, [fechaActual, codigoQR]);
    
    return {
      success: true,
      paqueteInfo: {
        ID_pack: data[8], // data[8] es ID_pack
        destinatario: data[15], // data[14] es nombre_destinatario
        departamento: data[16], // data[15] es N_departamento
        telefono: data[17], // data[16] es telefono
        fechaEntrega: data[11], // data[10] es fecha_entrega
        ubicacion: data[14], // data[11] es ubicacion
        fechaRetiro: fechaActual,
        userRetirador: data[18] // CAMBIO: data[17] es nombre_retirador en lugar de adminRetiro
      }
    };
    
  } catch (error) {
    console.error("Error al procesar escaneo QR:", error.message);
    throw error;
  } finally {
    db.close();
  }
}

// Función para limpiar códigos QR expirados
export function limpiarCodigosQRExpirados() {
  const db = new DB(dbPath);
  try {
    const fechaActual = new Date().toISOString();
    
    const updateQuery = `
      UPDATE CodigosQR 
      SET estado = 'expirado'
      WHERE fecha_expiracion < ? AND estado = 'activo'
    `;
    
    const result = db.query(updateQuery, [fechaActual]);
    
    return {
      success: true,
      codigosExpirados: result.length
    };
  } catch (error) {
    console.error("Error al limpiar códigos QR expirados:", error.message);
    throw error;
  } finally {
    db.close();
  }
}