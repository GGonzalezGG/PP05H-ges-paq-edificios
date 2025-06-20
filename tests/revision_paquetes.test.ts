// revision_paquetes.test.ts
import { assertEquals, assertRejects } from "https://deno.land/std@0.219.0/testing/asserts.ts";
import { assertSpyCall, assertSpyCalls, spy, stub, restore } from "https://deno.land/std@0.219.0/testing/mock.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std@0.219.0/testing/bdd.ts";

// Función sleep que necesitamos para las pruebas
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Variables para simular las funciones de base de datos
let mockPaquetesData: any[] = [];
let mockContactoData: any = { success: false };
let mockEnvioExitoso = false;
let mockDbError: Error | null = null;
let mockContactoError: Error | null = null;
let mockEnvioError: Error | null = null;
let contadorLlamadasContacto = 0;

// Funciones mock que simulan el comportamiento de las funciones reales
async function mockGetPaquetesPorVencer(diasAntes: number): Promise<any[]> {
  if (mockDbError) {
    throw mockDbError;
  }
  return mockPaquetesData;
}

async function mockGetUsuarioContactInfo(idUsuario: number): Promise<any> {
  if (mockContactoError) {
    throw mockContactoError;
  }
  
  // Para casos con múltiples usuarios, alternar respuestas
  if (Array.isArray(mockContactoData)) {
    const resultado = mockContactoData[contadorLlamadasContacto % mockContactoData.length];
    contadorLlamadasContacto++;
    return resultado;
  }
  
  return mockContactoData;
}

async function mockRegistrarEstadoNotificacionWhatsApp(
  idPaquete: number,
  idUsuario: number,
  estado: string
): Promise<any> {
  return { success: true };
}

async function mockEnviarMensajeTemplate(telefono: string): Promise<boolean> {
  if (mockEnvioError) {
    throw mockEnvioError;
  }
  return mockEnvioExitoso;
}

// Función principal a probar - adaptada con las funciones mock
async function revisarPaquetesPorVencer(): Promise<void> {
  console.log("🔍 Iniciando revisión de paquetes próximos a vencer...");
  
  try {
    // Obtener paquetes que vencen en 3 días
    const paquetesPorVencer = await mockGetPaquetesPorVencer(3);
    
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
        const contactoUsuario = await mockGetUsuarioContactInfo(paquete.ID_userDestinatario);
        
        if (!contactoUsuario.success || !contactoUsuario.data.telefono) {
          console.log(`❌ No se pudo obtener teléfono para usuario ${paquete.ID_userDestinatario}`);
          continue;
        }
        
        // Enviar notificación por WhatsApp
        console.log(`📲 Enviando notificación de vencimiento a ${contactoUsuario.data.telefono}`);
        
        const envioExitoso = await mockEnviarMensajeTemplate(contactoUsuario.data.telefono);
        
        if (envioExitoso) {
          // Registrar que se envió la notificación de vencimiento
          await mockRegistrarEstadoNotificacionWhatsApp(
            paquete.ID_pack,
            paquete.ID_userDestinatario,
            "notificacion_vencimiento_enviada"
          );
          
          console.log(`✅ Notificación de vencimiento enviada para paquete ${paquete.ID_pack}`);
        } else {
          console.log(`❌ Error al enviar notificación de vencimiento para paquete ${paquete.ID_pack}`);
          
          await mockRegistrarEstadoNotificacionWhatsApp(
            paquete.ID_pack,
            paquete.ID_userDestinatario,
            "error_notificacion_vencimiento"
          );
        }
        
        // Pequeña pausa entre envíos para no saturar la API
        await sleep(1);
        
      } catch (error) {
        console.error(`❌ Error procesando paquete ${paquete.ID_pack}:`, error);
      }
    }
    
    console.log("✅ Revisión de paquetes próximos a vencer completada");
    
  } catch (error) {
    console.error("❌ Error en revisión de paquetes por vencer:", error);
  }
}

// Función para iniciar revisión periódica (simulada para pruebas)
async function iniciarRevisionPeriodica(): Promise<{ intervalId: number }> {
  console.log("⏰ Iniciando sistema de revisión periódica de paquetes...");
  
  // Ejecutar inmediatamente al iniciar
  await revisarPaquetesPorVencer();
  
  // Ejecutar cada 24 horas (para pruebas usamos 100ms)
  const intervalId = setInterval(() => {
    const ahora = new Date();
    console.log(`⏰ Ejecutando revisión programada - ${ahora.toLocaleString('es-ES')}`);
    revisarPaquetesPorVencer();
  }, 100); // 100ms para pruebas, en producción sería 24 * 60 * 60 * 1000
  
  console.log("✅ Sistema de revisión periódica configurado");
  
  return { intervalId };
}

describe("Revisión de Paquetes Por Vencer", () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Resetear datos mock
    mockPaquetesData = [];
    mockContactoData = { success: false };
    mockEnvioExitoso = false;
    mockDbError = null;
    mockContactoError = null;
    mockEnvioError = null;
    contadorLlamadasContacto = 0;
    
    // Crear spies para console
    consoleLogSpy = spy(console, "log");
    consoleErrorSpy = spy(console, "error");
  });

  afterEach(() => {
    // Restaurar spies
    restore();
  });

  describe("revisarPaquetesPorVencer", () => {
    it("debería manejar correctamente cuando no hay paquetes por vencer", async () => {
      // Arrange
      mockPaquetesData = [];

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 2);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["✅ No hay paquetes próximos a vencer"] });
    });

    it("debería procesar correctamente paquetes sin notificación previa", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 1,
          ID_userDestinatario: 100,
          nombre_destinatario: "Juan Pérez",
          notificacion_vencimiento_enviada: false
        }
      ];
      
      mockContactoData = {
        success: true,
        data: {
          nombre: "Juan",
          apellido: "Pérez",
          telefono: "+56912345678"
        }
      };

      mockEnvioExitoso = true;

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 6);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 1 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 1 para Juan Pérez"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["📲 Enviando notificación de vencimiento a +56912345678"] });
      assertSpyCall(consoleLogSpy, 4, { args: ["✅ Notificación de vencimiento enviada para paquete 1"] });
      assertSpyCall(consoleLogSpy, 5, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });

    it("debería omitir paquetes que ya tienen notificación enviada", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 2,
          ID_userDestinatario: 101,
          nombre_destinatario: "María González",
          notificacion_vencimiento_enviada: true
        }
      ];

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 5);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 1 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 2 para María González"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["⚠️ Ya se envió notificación de vencimiento para paquete 2"] });
      assertSpyCall(consoleLogSpy, 4, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });

    it("debería manejar error cuando no se puede obtener información de contacto", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 3,
          ID_userDestinatario: 102,
          nombre_destinatario: "Carlos Ruiz",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = {
        success: false,
        error: "Usuario no encontrado"
      };

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 5);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 1 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 3 para Carlos Ruiz"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["❌ No se pudo obtener teléfono para usuario 102"] });
      assertSpyCall(consoleLogSpy, 4, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });

    it("debería manejar error cuando no hay teléfono en los datos de contacto", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 4,
          ID_userDestinatario: 103,
          nombre_destinatario: "Ana Silva",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = {
        success: true,
        data: {
          nombre: "Ana",
          apellido: "Silva",
          telefono: null // Sin teléfono
        }
      };

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 5);
      assertSpyCall(consoleLogSpy, 3, { args: ["❌ No se pudo obtener teléfono para usuario 103"] });
    });

    it("debería manejar error cuando falla el envío de WhatsApp", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 5,
          ID_userDestinatario: 104,
          nombre_destinatario: "Pedro López",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = {
        success: true,
        data: {
          nombre: "Pedro",
          apellido: "López",
          telefono: "+56987654321"
        }
      };

      mockEnvioExitoso = false; // Simular fallo

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 6);
      assertSpyCall(consoleLogSpy, 4, { args: ["❌ Error al enviar notificación de vencimiento para paquete 5"] });
    });

    it("debería procesar múltiples paquetes correctamente", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 6,
          ID_userDestinatario: 105,
          nombre_destinatario: "Lucía Morales",
          notificacion_vencimiento_enviada: false
        },
        {
          ID_pack: 7,
          ID_userDestinatario: 106,
          nombre_destinatario: "Roberto Castro",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = [
        {
          success: true,
          data: { nombre: "Lucía", apellido: "Morales", telefono: "+56911111111" }
        },
        {
          success: true,
          data: { nombre: "Roberto", apellido: "Castro", telefono: "+56922222222" }
        }
      ];

      mockEnvioExitoso = true;

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 9);
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 2 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 6 para Lucía Morales"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["📲 Enviando notificación de vencimiento a +56911111111"] });
      assertSpyCall(consoleLogSpy, 4, { args: ["✅ Notificación de vencimiento enviada para paquete 6"] });
      assertSpyCall(consoleLogSpy, 5, { args: ["📱 Procesando paquete ID: 7 para Roberto Castro"] });
      assertSpyCall(consoleLogSpy, 6, { args: ["📲 Enviando notificación de vencimiento a +56922222222"] });
      assertSpyCall(consoleLogSpy, 7, { args: ["✅ Notificación de vencimiento enviada para paquete 7"] });
      assertSpyCall(consoleLogSpy, 8, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });

    it("debería manejar errores individuales por paquete sin afectar otros", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 8,
          ID_userDestinatario: 107,
          nombre_destinatario: "Error User",
          notificacion_vencimiento_enviada: false
        },
        {
          ID_pack: 9,
          ID_userDestinatario: 108,
          nombre_destinatario: "Success User",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = [
        {
          success: false,
          error: "Usuario no encontrado"
        },
        {
          success: true,
          data: { nombre: "Success", apellido: "User", telefono: "+56922222222" }
        }
      ];

      mockEnvioExitoso = true;

      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 8);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 2 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 8 para Error User"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["❌ No se pudo obtener teléfono para usuario 107"] });
      assertSpyCall(consoleLogSpy, 4, { args: ["📱 Procesando paquete ID: 9 para Success User"] });
      assertSpyCall(consoleLogSpy, 5, { args: ["📲 Enviando notificación de vencimiento a +56922222222"] });
      assertSpyCall(consoleLogSpy, 6, { args: ["✅ Notificación de vencimiento enviada para paquete 9"] });
      assertSpyCall(consoleLogSpy, 7, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });
  });

  describe("iniciarRevisionPeriodica", () => {
    let intervalIds: number[] = [];

    afterEach(() => {
      // Limpiar todos los intervalos
      intervalIds.forEach(id => clearInterval(id));
      intervalIds = [];
      restore();
    });

    it("debería iniciar el sistema y ejecutar revisión inmediata", async () => {
      // Arrange
      mockPaquetesData = [];

      // Act
      const resultado = await iniciarRevisionPeriodica();
      intervalIds.push(resultado.intervalId);

      // Assert
      assertEquals(typeof resultado.intervalId, "number");
      
      // Verificar logs en el orden correcto
      assertSpyCall(consoleLogSpy, 0, { args: ["⏰ Iniciando sistema de revisión periódica de paquetes..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 2, { args: ["✅ No hay paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["✅ Sistema de revisión periódica configurado"] });
    });

    it("debería ejecutar revisiones periódicas", async () => {
      // Arrange
      mockPaquetesData = [];

      // Act
      const resultado = await iniciarRevisionPeriodica();
      intervalIds.push(resultado.intervalId);

      // Esperar tiempo suficiente para al menos 2 ejecuciones adicionales del intervalo
      await sleep(300);

      // Assert
      // Verificar logs iniciales
      assertSpyCall(consoleLogSpy, 0, { args: ["⏰ Iniciando sistema de revisión periódica de paquetes..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 2, { args: ["✅ No hay paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["✅ Sistema de revisión periódica configurado"] });

      // Verificar que al menos una ejecución programada ocurrió
      const hasScheduledExecution = consoleLogSpy.calls.some((call: any) => 
        call.args.length === 1 && 
        typeof call.args[0] === 'string' && 
        call.args[0].includes("⏰ Ejecutando revisión programada")
      );
      assertEquals(hasScheduledExecution, true);
      
      // Verificar que hay suficientes llamadas (inicial + al menos 2 del intervalo)
      assertEquals(consoleLogSpy.calls.length >= 7, true);
    });

    it("debería procesar paquetes en ejecuciones periódicas", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 10,
          ID_userDestinatario: 110,
          nombre_destinatario: "Test Periódico",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = {
        success: true,
        data: {
          nombre: "Test",
          apellido: "Periódico",
          telefono: "+56999999999"
        }
      };

      mockEnvioExitoso = true;

      // Act
      const resultado = await iniciarRevisionPeriodica();
      intervalIds.push(resultado.intervalId);

      // Esperar tiempo suficiente para ejecuciones del intervalo
      await sleep(250);

      // Assert
      // Verificar que se procesaron paquetes tanto en la ejecución inicial como en las periódicas
      const processingLogs = consoleLogSpy.calls.filter((call: any) => 
        call.args.length === 1 && 
        typeof call.args[0] === 'string' && 
        call.args[0].includes("📱 Procesando paquete ID: 10")
      );
      
      assertEquals(processingLogs.length >= 2, true); // Al menos inicial + 1 periódica
    });
  });
});