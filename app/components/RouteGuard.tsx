// app/components/RouteGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RouteGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function RouteGuard({ children, adminOnly = false }: RouteGuardProps) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación cuando el componente se monta
    checkAuth();
  }, []);

  const checkAuth = () => {
    console.log("Verificando autenticación...");
    // Verificar token
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.log("No hay token, redirigiendo a login");
      setAuthorized(false);
      setLoading(false);
      router.push("/login");
      return;
    }

    // Si se requiere rol admin, verificar rol
    if (adminOnly) {
      const userDataStr = localStorage.getItem("userData");
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          console.log("Datos de usuario encontrados:", userData);
          console.log("¿Es admin?:", userData.admin);
          
          // Verificar explícitamente que admin sea true o 1
          const isAdmin = userData.admin === true || userData.admin === 1;
          
          if (!isAdmin) {
            console.log("No es admin, redirigiendo a página de residente");
            setAuthorized(false);
            setLoading(false);
            router.push("/residente");
            return;
          }
        } catch (error) {
          console.error("Error al procesar datos de usuario:", error);
          setAuthorized(false);
          setLoading(false);
          router.push("/login");
          return;
        }
      } else {
        console.log("No hay datos de usuario, redirigiendo a login");
        setAuthorized(false);
        setLoading(false);
        router.push("/login");
        return;
      }
    }

    // Si pasa las verificaciones, autorizar
    console.log("Autorización exitosa");
    setAuthorized(true);
    setLoading(false);
  };

  // Mientras está verificando, mostrar pantalla de carga
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl">Verificando acceso...</p>
      </div>
    );
  }

  // Si no está autorizado, no renderizar nada (ya se redirigió)
  if (!authorized) {
    return null;
  }

  // Si está autorizado, renderizar el contenido
  return <>{children}</>;
}