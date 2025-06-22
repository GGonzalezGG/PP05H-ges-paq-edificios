// revision_paquetes.ts

// Interfaces para tipado
export interface Paquete {
  ID_pack: number;
  ID_userDestinatario: number;
  nombre_destinatario: string;
  notificacion_vencimiento_enviada: boolean;
}

export interface ContactoUsuario {
  success: boolean;
  data?: {
    nombre: string;
    apellido: string;
    telefono: string;
  };
  error?: string;
}

export interface RegistroNotificacion {
  success: boolean;
}

// Función sleep de ayuda
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Funciones simuladas para medir dependencias sin tener que consultar a la base de datos o API de whatsapp
export async function getPaquetesPorVencer(diasAntes: number): Promise<Paquete[]> { 
  // Retorna array vacío como simulador (mock)
  return [];
}

export async function getUsuarioContactInfo(idUsuario: number): Promise<ContactoUsuario> {
  // Retorna success: false como simulador (mock)
  return { success: false };
}

export async function registrarEstadoNotificacionWhatsApp(
  idPaquete: number,
  idUsuario: number,
  estado: string
): Promise<RegistroNotificacion> {
  // retorna success: true como simulador (mock)
  return { success: true };
}

export async function enviarMensajeTemplate(telefono: string): Promise<boolean> {
  // Retorna false como simulador (mock)
  return false;
}

// Dependencias que pueden ser inyectadas para testing
export interface RevisionDependencies {
  getPaquetesPorVencer: (diasAntes: number) => Promise<Paquete[]>;
  getUsuarioContactInfo: (idUsuario: number) => Promise<ContactoUsuario>;
  registrarEstadoNotificacionWhatsApp: (idPaquete: number, idUsuario: number, estado: string) => Promise<RegistroNotificacion>;
  enviarMensajeTemplate: (telefono: string) => Promise<boolean>;
  sleep: (ms: number) => Promise<void>;
}

// Función principal con inyección de dependencias
export async function revisarPaquetesPorVencer(
  deps: RevisionDependencies = {
    getPaquetesPorVencer,
    getUsuarioContactInfo,
    registrarEstadoNotificacionWhatsApp,
    enviarMensajeTemplate,
    sleep
  }
): Promise<void> {
  console.log("🔍 Iniciando revisión de paquetes próximos a vencer...");
  
  try {
    // Obtener paquetes que vencen en 3 días
    const paquetesPorVencer = await deps.getPaquetesPorVencer(3);
    
    if (paquetesPorVencer.length === 0) {
      console.log("✅ No hay paquetes próximos a vencer");
      return;
    }
    
    console.log(`📦 Encontrados ${paquetesPorVencer.length} paquetes próximos a vencer`);
    
    for (const paquete of paquetesPorVencer) {
      try {
        console.log(`📱 Procesando paquete ID: ${paquete.ID_pack} para ${paquete.nombre_destinatario}`);
        
        // Verificar si ya se envió notificación de vencimiento para este paquete
        if (paquete.notificacion_vencimiento_enviada) {
          console.log(`⚠️ Ya se envió notificación de vencimiento para paquete ${paquete.ID_pack}`);
          continue;
        }
        
        // Obtener información de contacto del destinatario
        const contactoUsuario = await deps.getUsuarioContactInfo(paquete.ID_userDestinatario);
        
        if (!contactoUsuario.success || !contactoUsuario.data?.telefono) {
          console.log(`❌ No se pudo obtener teléfono para usuario ${paquete.ID_userDestinatario}`);
          continue;
        }
        
        // Enviar notificación por WhatsApp
        console.log(`📲 Enviando notificación de vencimiento a ${contactoUsuario.data.telefono}`);
        
        const envioExitoso = await deps.enviarMensajeTemplate(contactoUsuario.data.telefono);
        
        if (envioExitoso) {
          // Registrar que se envió la notificación de vencimiento
          await deps.registrarEstadoNotificacionWhatsApp(
            paquete.ID_pack,
            paquete.ID_userDestinatario,
            "notificacion_vencimiento_enviada"
          );
          
          console.log(`✅ Notificación de vencimiento enviada para paquete ${paquete.ID_pack}`);
        } else {
          console.log(`❌ Error al enviar notificación de vencimiento para paquete ${paquete.ID_pack}`);
          
          await deps.registrarEstadoNotificacionWhatsApp(
            paquete.ID_pack,
            paquete.ID_userDestinatario,
            "error_notificacion_vencimiento"
          );
        }
        
        // Pequeña pausa entre envíos para no saturar la API
        await deps.sleep(1);
        
      } catch (error) {
        console.error(`❌ Error procesando paquete ${paquete.ID_pack}:`, error);
      }
    }
    
    console.log("✅ Revisión de paquetes próximos a vencer completada");
    
  } catch (error) {
    console.error("❌ Error en revisión de paquetes por vencer:", error);
  }
}

// Función para iniciar revisión periódica con inyección de dependencias
export async function iniciarRevisionPeriodica(
  deps: RevisionDependencies = {
    getPaquetesPorVencer,
    getUsuarioContactInfo,
    registrarEstadoNotificacionWhatsApp,
    enviarMensajeTemplate,
    sleep
  }
): Promise<{ intervalId: number }> {
  console.log("⏰ Iniciando sistema de revisión periódica de paquetes...");
  
  // Ejecutar inmediatamente al iniciar
  await revisarPaquetesPorVencer(deps);
  
  // Ejecutar cada 24 horas (para pruebas usamos 100ms)
  const intervalId = setInterval(() => {
    const ahora = new Date();
    console.log(`⏰ Ejecutando revisión programada - ${ahora.toLocaleString('es-ES')}`);
    revisarPaquetesPorVencer(deps);
  }, 100); // 100ms para pruebas, en producción sería 24 * 60 * 60 * 1000
  
  console.log("✅ Sistema de revisión periódica configurado");
  
  return { intervalId };
}