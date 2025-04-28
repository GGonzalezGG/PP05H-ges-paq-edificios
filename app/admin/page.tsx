// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "../components/RouteGuard";
import RegistroPaqueteForm from "../components/RegistroPaqueteForm";

interface Usuario {
  id: number;
  username: string;
  nombre: string;
  apellido: string;
  N_departamento: string;
  rut: string;
  correo: string;
  telefono: string;
  admin: boolean;
}

interface Paquete {
  id: number;
  idDestinatario: number;
  idRetirador: number | null;
  fechaEntrega: string;
  fechaLimite: string | null;
  fechaRetiro: string | null;
  ubicacion: string;
  nombreDestinatario: string;
  apellidoDestinatario: string;
  departamento: string;
  nombreRetirador: string | null;
  apellidoRetirador: string | null;
}

export default function AdminPage() {
  const [userData, setUserData] = useState<any>(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [paquetes, setPaquetes] = useState<Paquete[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingPaquetes, setIsLoadingPaquetes] = useState(true);
  const [activeTab, setActiveTab] = useState("usuarios");
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
    
    // Cargar paquetes
    fetchPaquetes();
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
      setIsLoadingUsers(false);
    }
  };

  const fetchPaquetes = async () => {
    try {
      showLoadingToast();

      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No hay token disponible");
        return;
      }
      
      console.log("Obteniendo paquetes...");

      hideLoadingToast();
      const response = await fetch("http://localhost:8000/api/paquetes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Paquetes recibidos:", result);
      
      if (result.success && Array.isArray(result.data)) {
        setPaquetes(result.data);
      } else {
        console.error("La respuesta no contiene un array de paquetes:", result);
        setPaquetes([]);
      }
    } catch (error) {
      console.error("Error al obtener paquetes:", error);
      setPaquetes([]);
    } finally {
      setIsLoadingPaquetes(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    router.push("/login");
  };

  // Función para formatear fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No definido";
    
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para refrescar la lista de paquetes después de registrar uno nuevo
  const refreshPaquetes = () => {

    showLoadingToast();

    fetchPaquetes();

    hideLoadingToast();
    
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

        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 mb-6">
          <ul className="flex flex-wrap -mb-px">
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("usuarios")}
                className={`inline-block p-4 border-b-2 ${
                  activeTab === "usuarios"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
              >
                Usuarios
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("paquetes")}
                className={`inline-block p-4 border-b-2 ${
                  activeTab === "paquetes"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
              >
                Paquetes
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("registrar")}
                className={`inline-block p-4 border-b-2 ${
                  activeTab === "registrar"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent hover:text-gray-600 hover:border-gray-300"
                }`}
              >
                Registrar paquete
              </button>
            </li>
          </ul>
        </div>

        {/* Contenido de la pestaña de usuarios */}
        {activeTab === "usuarios" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Lista de usuarios</h2>
            {isLoadingUsers ? (
              <div className="flex justify-center">
                <p>Cargando usuarios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border text-zinc-950">
                {users.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Nombre completo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Departamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          RUT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
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
        )}

        {/* Contenido de la pestaña de paquetes */}
        {activeTab === "paquetes" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Lista de paquetes</h2>
            <div className="mb-4">
              <button 
                onClick={refreshPaquetes}
                className="bg-blue-600 text-white py-1 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Actualizar lista
              </button>
            </div>
            {isLoadingPaquetes ? (
              <div className="flex justify-center">
                <p>Cargando paquetes...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border text-zinc-950">
                {paquetes.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Destinatario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Departamento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Fecha Entrega
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Fecha Límite
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {paquetes.map((paquete) => (
                        <tr key={paquete.id}>
                          <td className="whitespace-nowrap px-6 py-4">
                            {paquete.id}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {paquete.nombreDestinatario} {paquete.apellidoDestinatario}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {paquete.departamento}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {formatDate(paquete.fechaEntrega)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {formatDate(paquete.fechaLimite)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {paquete.ubicacion}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            {paquete.fechaRetiro ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                Retirado
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                Pendiente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center">
                    <p>No hay paquetes para mostrar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contenido de la pestaña de registro de paquetes */}
        {activeTab === "registrar" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Registrar nuevo paquete</h2>
            <RegistroPaqueteForm />
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
