// app/db/auth.ts
// Esta sería una nueva función para verificar tokens
// En una aplicación real, esto usaría JWT u OAuth

// Almacén temporal de tokens válidos (en producción usarías Redis o similar)
const validTokens = new Map<string, { userId: number, expiresAt: number }>();

export function addValidToken(token: string, userId: number) {
  // Token válido por 24 horas
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  validTokens.set(token, { userId, expiresAt });
  return token;
}

export function verifyToken(token: string) {
  const tokenData = validTokens.get(token);
  
  if (!tokenData) {
    return { valid: false };
  }
  
  // Verificar expiración
  if (tokenData.expiresAt < Date.now()) {
    validTokens.delete(token);
    return { valid: false };
  }
  
  return { valid: true, userId: tokenData.userId };
}

export function removeToken(token: string) {
  validTokens.delete(token);
}