// revision_paquetes.test.ts
import { assertEquals } from "https://deno.land/std@0.219.0/testing/asserts.ts";
import { assertSpyCall, assertSpyCalls, spy, restore } from "https://deno.land/std@0.219.0/testing/mock.ts";
import { describe, it, beforeEach, afterEach } from "https://deno.land/std@0.219.0/testing/bdd.ts";

// Importar las funciones y tipos del archivo principal
import {
  revisarPaquetesPorVencer,
  iniciarRevisionPeriodica,
  sleep,
  getPaquetesPorVencer,
  getUsuarioContactInfo,
  registrarEstadoNotificacionWhatsApp,
  enviarMensajeTemplate,
  type Paquete,
  type ContactoUsuario,
  type RegistroNotificacion,
  type RevisionDependencies
} from "./revision_paquetes.ts";

// Variables para simular las funciones de base de datos
let mockPaquetesData: Paquete[] = [];
let mockContactoData: ContactoUsuario | ContactoUsuario[] = { success: false };
let mockEnvioExitoso = false;
let mockDbError: Error | null = null;
let mockContactoError: Error | null = null;
let mockEnvioError: Error | null = null;
let contadorLlamadasContacto = 0;

// Funciones mock que simulan el comportamiento de las funciones reales
async function mockGetPaquetesPorVencer(diasAntes: number): Promise<Paquete[]> {
  if (mockDbError) {
    throw mockDbError;
  }
  return mockPaquetesData;
}

async function mockGetUsuarioContactInfo(idUsuario: number): Promise<ContactoUsuario> {
  if (mockContactoError) {
    throw mockContactoError;
  }
  
  // Para casos con múltiples usuarios, alternar respuestas
  if (Array.isArray(mockContactoData)) {
    const resultado = mockContactoData[contadorLlamadasContacto % mockContactoData.length];
    contadorLlamadasContacto++;
    return resultado;
  }
  
  return mockContactoData as ContactoUsuario;
}

async function mockRegistrarEstadoNotificacionWhatsApp(
  idPaquete: number,
  idUsuario: number,
  estado: string
): Promise<RegistroNotificacion> {
  return { success: true };
}

async function mockEnviarMensajeTemplate(telefono: string): Promise<boolean> {
  if (mockEnvioError) {
    throw mockEnvioError;
  }
  return mockEnvioExitoso;
}

async function mockSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Crear objeto de dependencias mock
const createMockDeps = (): RevisionDependencies => ({
  getPaquetesPorVencer: mockGetPaquetesPorVencer,
  getUsuarioContactInfo: mockGetUsuarioContactInfo,
  registrarEstadoNotificacionWhatsApp: mockRegistrarEstadoNotificacionWhatsApp,
  enviarMensajeTemplate: mockEnviarMensajeTemplate,
  sleep: mockSleep
});

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
          telefono: "" // Sin teléfono
        }
      };
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

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

    it("debería manejar error al obtener paquetes de la base de datos", async () => {
      // Arrange
      mockDbError = new Error("Error de conexión a base de datos");
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

      // Assert
      assertSpyCalls(consoleLogSpy, 1);
      assertSpyCalls(consoleErrorSpy, 1);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleErrorSpy, 0, { 
        args: ["❌ Error en revisión de paquetes por vencer:", mockDbError] 
      });
    });

    it("debería manejar errores de excepción al obtener información de contacto", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 11,
          ID_userDestinatario: 111,
          nombre_destinatario: "Error Contact",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoError = new Error("Error al consultar contacto");
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

      // Assert
      assertSpyCalls(consoleLogSpy, 4);
      assertSpyCalls(consoleErrorSpy, 1);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 1 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 11 para Error Contact"] });
      assertSpyCall(consoleErrorSpy, 0, { 
        args: ["❌ Error procesando paquete 11:", mockContactoError] 
      });
      assertSpyCall(consoleLogSpy, 3, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });

    it("debería manejar errores de excepción al enviar mensaje", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 12,
          ID_userDestinatario: 112,
          nombre_destinatario: "Error Envío",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = {
        success: true,
        data: {
          nombre: "Error",
          apellido: "Envío",
          telefono: "+56988888888"
        }
      };

      mockEnvioError = new Error("Error de API WhatsApp");
      const deps = createMockDeps();

      // Act
      await revisarPaquetesPorVencer(deps);

      // Assert
      assertSpyCalls(consoleLogSpy, 5);
      assertSpyCalls(consoleErrorSpy, 1);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 1 paquetes próximos a vencer"] });
      assertSpyCall(consoleLogSpy, 2, { args: ["📱 Procesando paquete ID: 12 para Error Envío"] });
      assertSpyCall(consoleLogSpy, 3, { args: ["📲 Enviando notificación de vencimiento a +56988888888"] });
      assertSpyCall(consoleErrorSpy, 0, { 
        args: ["❌ Error procesando paquete 12:", mockEnvioError] 
      });
      assertSpyCall(consoleLogSpy, 4, { args: ["✅ Revisión de paquetes próximos a vencer completada"] });
    });

    it("debería registrar estado de error cuando falla el envío", async () => {
      // Arrange
      mockPaquetesData = [
        {
          ID_pack: 13,
          ID_userDestinatario: 113,
          nombre_destinatario: "Fallo Envío",
          notificacion_vencimiento_enviada: false
        }
      ];

      mockContactoData = {
        success: true,
        data: {
          nombre: "Fallo",
          apellido: "Envío",
          telefono: "+56977777777"
        }
      };

      mockEnvioExitoso = false;
      const deps = createMockDeps();
      
      // Crear spy para verificar que se llama registrarEstadoNotificacionWhatsApp con estado de error
      const registrarSpy = spy(deps, "registrarEstadoNotificacionWhatsApp");

      // Act
      await revisarPaquetesPorVencer(deps);

      // Assert
      assertSpyCalls(consoleLogSpy, 6);
      assertSpyCall(consoleLogSpy, 4, { args: ["❌ Error al enviar notificación de vencimiento para paquete 13"] });
      
      // Verificar que se registró el estado de error
      assertSpyCalls(registrarSpy, 1);
      assertSpyCall(registrarSpy, 0, { 
        args: [13, 113, "error_notificacion_vencimiento"] 
      });
    });

    it("debería manejar un escenario mixto completo con todos los casos posibles", async () => {
      // Arrange - Escenario que combina múltiples casos reales
      mockPaquetesData = [
        {
          ID_pack: 100,
          ID_userDestinatario: 200,
          nombre_destinatario: "Usuario Con Notificación Previa",
          notificacion_vencimiento_enviada: true
        },
        {
          ID_pack: 101,
          ID_userDestinatario: 201,
          nombre_destinatario: "Usuario Sin Teléfono",
          notificacion_vencimiento_enviada: false
        },
        {
          ID_pack: 102,
          ID_userDestinatario: 202,
          nombre_destinatario: "Usuario Exitoso",
          notificacion_vencimiento_enviada: false
        },
        {
          ID_pack: 103,
          ID_userDestinatario: 203,
          nombre_destinatario: "Usuario Fallo Envío",
          notificacion_vencimiento_enviada: false
        }
      ];

      // Resetear el contador antes de configurar los datos
      contadorLlamadasContacto = 0;
      
      // Configurar respuestas para cada llamada en orden
      mockContactoData = [
        { success: true, data: { nombre: "Sin", apellido: "Telefono", telefono: "" } }, // Para ID 201 - Sin teléfono
        { success: true, data: { nombre: "Usuario", apellido: "Exitoso", telefono: "+56911111111" } }, // Para ID 202 - Exitoso
        { success: true, data: { nombre: "Fallo", apellido: "Envio", telefono: "+56922222222" } } // Para ID 203 - Fallo envío
      ];

      // Configurar que el envío falle solo para un teléfono específico
      mockEnvioExitoso = true; // Por defecto exitoso
      
      // Crear una función mock personalizada para el envío
      async function mockEnviarMensajeEspecifico(telefono: string): Promise<boolean> {
        if (telefono === "+56922222222") {
          return false; // Falla para este teléfono específico
        }
        return true; // Éxito para los demás
      }

      const deps: RevisionDependencies = {
        getPaquetesPorVencer: mockGetPaquetesPorVencer,
        getUsuarioContactInfo: mockGetUsuarioContactInfo,
        registrarEstadoNotificacionWhatsApp: mockRegistrarEstadoNotificacionWhatsApp,
        enviarMensajeTemplate: mockEnviarMensajeEspecifico,
        sleep: mockSleep
      };

      // Act
      await revisarPaquetesPorVencer(deps);

      // Assert - Verificar que se encontraron los 4 paquetes
      assertSpyCall(consoleLogSpy, 1, { args: ["📦 Encontrados 4 paquetes próximos a vencer"] });

      // Verificar que se procesaron todos los paquetes (4 mensajes de procesamiento)
      const logsProcessing = consoleLogSpy.calls.filter((call: any) => 
        call.args[0] && call.args[0].includes("📱 Procesando paquete ID:")
      );
      assertEquals(logsProcessing.length, 4);

      // Verificar casos específicos
      const hasNotificationAlreadySent = consoleLogSpy.calls.some((call: any) => 
        call.args[0] && call.args[0].includes("⚠️ Ya se envió notificación de vencimiento para paquete 100")
      );
      assertEquals(hasNotificationAlreadySent, true);

      const hasPhoneError = consoleLogSpy.calls.some((call: any) => 
        call.args[0] && call.args[0].includes("❌ No se pudo obtener teléfono para usuario 201")
      );
      assertEquals(hasPhoneError, true);

      const hasSuccessfulSend = consoleLogSpy.calls.some((call: any) => 
        call.args[0] && call.args[0].includes("✅ Notificación de vencimiento enviada para paquete 102")
      );
      assertEquals(hasSuccessfulSend, true);

      const hasFailedSend = consoleLogSpy.calls.some((call: any) => 
        call.args[0] && call.args[0].includes("❌ Error al enviar notificación de vencimiento para paquete 103")
      );
      assertEquals(hasFailedSend, true);

      // Verificar que terminó correctamente
      const hasCompletionMessage = consoleLogSpy.calls.some((call: any) => 
        call.args[0] && call.args[0].includes("✅ Revisión de paquetes próximos a vencer completada")
      );
      assertEquals(hasCompletionMessage, true);
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
      const deps = createMockDeps();

      // Act
      const resultado = await iniciarRevisionPeriodica(deps);
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
      const deps = createMockDeps();

      // Act
      const resultado = await iniciarRevisionPeriodica(deps);
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
      const deps = createMockDeps();

      // Act
      const resultado = await iniciarRevisionPeriodica(deps);
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

  describe("Funciones Mock por Defecto", () => {
    it("debería ejecutar getPaquetesPorVencer con comportamiento mock por defecto", async () => {
      // Act
      const resultado = await getPaquetesPorVencer(3);

      // Assert
      assertEquals(resultado, []);
      assertEquals(Array.isArray(resultado), true);
    });

    it("debería ejecutar getUsuarioContactInfo con comportamiento mock por defecto", async () => {
      // Act
      const resultado = await getUsuarioContactInfo(123);

      // Assert
      assertEquals(resultado.success, false);
      assertEquals(resultado.data, undefined);
      assertEquals(resultado.error, undefined);
    });

    it("debería ejecutar registrarEstadoNotificacionWhatsApp con comportamiento mock por defecto", async () => {
      // Act
      const resultado = await registrarEstadoNotificacionWhatsApp(1, 100, "test");

      // Assert
      assertEquals(resultado.success, true);
    });

    it("debería ejecutar enviarMensajeTemplate con comportamiento mock por defecto", async () => {
      // Act
      const resultado = await enviarMensajeTemplate("+56912345678");

      // Assert
      assertEquals(resultado, false);
    });
  });

  describe("Funciones Principales con Dependencias por Defecto", () => {
    it("debería ejecutar revisarPaquetesPorVencer sin parámetros (usando dependencias por defecto)", async () => {
      // Arrange - No pasar dependencias para usar las por defecto
      
      // Act
      await revisarPaquetesPorVencer();

      // Assert
      assertSpyCalls(consoleLogSpy, 2);
      assertSpyCall(consoleLogSpy, 0, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
      assertSpyCall(consoleLogSpy, 1, { args: ["✅ No hay paquetes próximos a vencer"] });
    });

    it("debería ejecutar iniciarRevisionPeriodica sin parámetros (usando dependencias por defecto)", async () => {
      // Arrange
      let intervalId: number;

      try {
        // Act
        const resultado = await iniciarRevisionPeriodica();
        intervalId = resultado.intervalId;

        // Assert
        assertEquals(typeof resultado.intervalId, "number");
        
        // Verificar logs iniciales
        assertSpyCall(consoleLogSpy, 0, { args: ["⏰ Iniciando sistema de revisión periódica de paquetes..."] });
        assertSpyCall(consoleLogSpy, 1, { args: ["🔍 Iniciando revisión de paquetes próximos a vencer..."] });
        assertSpyCall(consoleLogSpy, 2, { args: ["✅ No hay paquetes próximos a vencer"] });
        assertSpyCall(consoleLogSpy, 3, { args: ["✅ Sistema de revisión periódica configurado"] });

      } finally {
        // Cleanup - Limpiar el intervalo
        if (intervalId!) {
          clearInterval(intervalId);
        }
      }
    });
  });

});
