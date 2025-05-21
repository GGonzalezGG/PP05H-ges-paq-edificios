// app/config/config.ts
import "jsr:@std/dotenv/load";

export const config = {
    whatsappApiUrl: "https://graph.facebook.com/v22.0/660499770460535", // Reemplazar con tu Phone Number ID
    whatsappToken: Deno.env.get("WHATSAPP_API_TOKEN"),
    dbPath: "./app/db/database.db"
  };