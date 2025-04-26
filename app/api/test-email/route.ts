import { NextResponse } from "next/server";
import { sendEmail } from "@app/utils/sendEmail";

// Example Package class interface
type Package = {
  recipientName: string;
  apartmentNumber: string;
  receivedDate: Date;
  receivedBy: string;
  status: 'pending' | 'delivered' | 'returned';
  notes?: string;
};

export async function GET() {
  try {
    // 1. Simulate package data
    const testPackage: Package = {
      recipientName: "Luis Soto",
      apartmentNumber: "906",
      receivedDate: new Date(),
      receivedBy: "Juan Pérez",
      status: "pending",
      notes: "Caja frágil",
    };

    // 2. Build email content dynamically
    const formattedDate = new Date(testPackage.receivedDate).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailBody = `
      <div style="font-family: sans-serif; line-height: 1.5">
        <h2>📦 ¡Tu paquete ha llegado!</h2>
        <p>Hola <strong>${testPackage.recipientName}</strong>,</p>
        <p>Hemos recibido un paquete para el departamento <strong>${testPackage.apartmentNumber}</strong>.</p>

        <ul>
          <li><strong>Fecha de recepción:</strong> ${formattedDate}</li>
          <li><strong>Recibido por:</strong> ${testPackage.receivedBy}</li>
          <li><strong>Estado:</strong> ${testPackage.status}</li>
          ${testPackage.notes ? `<li><strong>Notas:</strong> ${testPackage.notes}</li>` : ''}
        </ul>

        <p>Puedes retirarlo en conserjería.</p>
        <p>Gracias,<br/>Tu equipo de administración</p>
      </div>
    `;

    // 3. Send the email
    await sendEmail({
      to: "xkiritox1995@gmail.com",
      subject: "📬 Notificación de Paquete Recibido",
      html: emailBody,
    });

    return NextResponse.json({ message: "Test package email sent!" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
