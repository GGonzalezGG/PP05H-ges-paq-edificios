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
      SELECT nombre, apellido, telefono, correo
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
        telefono: userData[0][2] as string,
        correo: userData[0][3] as string
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
