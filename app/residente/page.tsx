// app/residente/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "../components/RouteGuard";

export default function ResidentePage() {
  const [userData, setUserData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      try {
        const parsedUserData = JSON.parse(userDataStr);
        setUserData(parsedUserData);
      } catch (error) {
        console.error("Error al procesar datos de usuario:", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    router.push("/login");
  };

  return (
    <RouteGuard>
      <div className="container mx-auto px-4 py-8 text-zinc-950">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Portal de Residente</h1>
          <div>
            <p className="text-gray-600">
              Bienvenido, {userData?.nombre} {userData?.apellido}
            </p>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:underline"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Información Personal</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Usuario:</span> {userData?.username}</p>
              <p><span className="font-medium">Departamento:</span> {userData?.N_departamento}</p>
              <p><span className="font-medium">RUT:</span> {userData?.rut}</p>
              <p><span className="font-medium">Correo:</span> {userData?.correo}</p>
              <p><span className="font-medium">Teléfono:</span> {userData?.telefono}</p>
              <p><span className="font-medium">Retiro compartido:</span> {userData?.retiro_compartido ? "Habilitado" : "No habilitado"}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Acciones rápidas</h2>
            <div className="space-y-3">
              <button className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Ver paquetes pendientes
              </button>
              <button className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                Reportar incidencia
              </button>
              <button className="w-full rounded-md bg-purple-600 px-4 py-2 text-white hover:bg-purple-700">
                Contactar administración
              </button>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}