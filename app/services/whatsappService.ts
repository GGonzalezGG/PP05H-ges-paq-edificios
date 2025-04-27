// app/services/whatsappService.ts
import { config } from "../config/config.ts";

export interface WhatsappTemplatePayload {
    messaging_product: string;
    recipient_type: string;
    to: string;
    type: string;
    template: {
      name: string;
      language: {
        code: string;
      };
      components?: Array<{
        type: string;
        parameters: Array<{
          type: string;
          text?: string;
          image?: {
            link: string;
          };
        }>;
      }>;
    };
  }

export interface WhatsappMessagePayload {
  messaging_product: string;
  recipient_type: string;
  to: string;
  type: string;
  text: {
    body: string;
  };
}

// Función corregida para enviarMensajeTemplate en whatsappService.ts
export async function enviarMensajeTemplate(
    telefono: string
  ): Promise<boolean> {
    try {
      // Asegurar que el teléfono tenga formato internacional
      const telefonoFormateado = formatearNumeroTelefono(telefono);
      
      const templatePayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: telefonoFormateado,
        type: "template",
        template: {
          name: "hello_world", // Nombre del template registrado en WhatsApp Business
          language: {
            code: "en_US" // Código de idioma español
          }
          // No incluimos el array de components ya que no hay parámetros
        }
      };
  
      const response = await fetch(`${config.whatsappApiUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.whatsappToken}`
        },
        body: JSON.stringify(templatePayload)
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error al enviar mensaje template:", errorData);
        return false;
      }
  
      const data = await response.json();
      console.log("Mensaje template enviado correctamente:", data);
      return true;
    } catch (error) {
      console.error("Error en el servicio de WhatsApp:", error);
      return false;
    }
  }

export async function enviarMensajeDetallado(
  telefono: string,
  detallesPaquete: {
    fecha: string;
    ubicacion: string;
    descripcion?: string;
  }
): Promise<boolean> {
  try {
    const telefonoFormateado = formatearNumeroTelefono(telefono);
    
    // Formatear fecha
    const fechaFormateada = new Date(detallesPaquete.fecha).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Construir mensaje
    let mensaje = `Detalles de tu paquete:\n📅 Fecha de entrega: ${fechaFormateada}\n📍 Ubicación: ${detallesPaquete.ubicacion}`;
    
    if (detallesPaquete.descripcion) {
      mensaje += `\n📦 Descripción: ${detallesPaquete.descripcion}`;
    }
    
    mensaje += "\n\nPor favor, retíralo lo antes posible. ¡Gracias!";

    const messagePayload: WhatsappMessagePayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: telefonoFormateado,
      type: "text",
      text: {
        body: mensaje
      }
    };

    const response = await fetch(`${config.whatsappApiUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${whatsappToken}`
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al enviar mensaje detallado:", errorData);
      return false;
    }

    const data = await response.json();
    console.log("Mensaje detallado enviado correctamente:", data);
    return true;
  } catch (error) {
    console.error("Error en el envío de mensaje detallado:", error);
    return false;
  }
}

// Función auxiliar para formatear números de teléfono
function formatearNumeroTelefono(telefono: string): string {
  // Eliminar espacios, guiones y paréntesis
  let telefonoLimpio = telefono.replace(/[\s\-()]/g, "");
  
  // Si no comienza con +, agregar el código de país (ajusta según tu país)
  if (!telefonoLimpio.startsWith("+")) {
    // Asumiendo Chile (+56) como ejemplo, ajusta según corresponda
    telefonoLimpio = "56" + (telefonoLimpio.startsWith("9") ? "" : "9") + telefonoLimpio;
  }
  
  return telefonoLimpio;
}