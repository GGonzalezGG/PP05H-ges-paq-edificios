import { NextResponse } from "next/server";
import { sendEmail } from "@app/utils/sendEmail";

export async function GET() {
  try {
    await sendEmail({
      to: "xkiritox1995@gmail.com", // Change to your test email
      subject: "📦 Package Notification Test",
      html: `
        <h2>Tu paquete ha llegado</h2>
        <p>Hola, hemos recibido tu paquete y se encuentra en conserjeria</p>
        <p><strong>Status:</strong> Delivered</p>
      `,
    });

    return NextResponse.json({ message: "Test email sent!" });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
