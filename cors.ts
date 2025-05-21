// Encabezados CORS para permitir solicitudes desde tu app Next.js
export const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // En producción, restringe a tu dominio
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400" // 24 horas
  };