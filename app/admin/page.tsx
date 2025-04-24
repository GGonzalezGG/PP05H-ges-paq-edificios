// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "../components/RouteGuard";
import { corsHeaders } from "@/cors";

export default function AdminPage() {
  const [userData, setUserData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]); // Inicializar como array vacío
  const [isLoading, setIsLoading] = useState(true);
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
    
    // Cargar usuarios
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No hay token disponible");
        router.push("/login");
        return;
      }
      
      console.log("Obteniendo usuarios...");
      const response = await fetch("http://localhost:8000/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Datos recibidos:", data);
      
      // Asegurarse de que data sea un array antes de asignarlo
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error("La respuesta no es un array:", data);
        setUsers([]); // Asignar array vacío si no es un array
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
      setUsers([]); // En caso de error, asignar array vacío
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    router.push("/login");
  };

  return (
    <RouteGuard adminOnly={true}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Panel de Administrador</h1>
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

        {isLoading ? (
          <div className="flex justify-center">
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border text-zinc-950">
            {users.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nombre completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      RUT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Rol
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        {user.username}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {user.nombre} {user.apellido}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {user.N_departamento}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{user.rut}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {user.correo}<br />
                        {user.telefono}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {user.admin ? "Administrador" : "Residente"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6 text-center">
                <p>No hay usuarios para mostrar</p>
              </div>
            )}
          </div>
        )}
      </div>
    </RouteGuard>
  );
}