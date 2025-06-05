const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const RESEND_API_URL = "https://api.resend.com/emails";

interface EmailData {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({from, to, subject, html }: EmailData) {
  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from, // Default sandbox sender for tests
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Email failed:", error);
    throw new Error("Failed to send email");
  }

  const data = await response.json();
  console.log("Email sent:", data);
  return data;
}
