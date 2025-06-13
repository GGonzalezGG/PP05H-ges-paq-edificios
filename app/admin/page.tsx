// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RouteGuard from "../components/RouteGuard";
import RegistroPaqueteForm from "../components/RegistroPaqueteForm";
import { ToastContainer } from 'react-toastify';
import { showLoadingToast, hideLoadingToast } from '../components/toastLoading';
import RegistroUsuarioForm from "../components/RegistroUsuarioForm";
import 'react-toastify/dist/ReactToastify.css';
import ReclamosPanel from "../components/ReclamosPanel";
import Dashboard from '../components/Dashboard';
import { paquetesConfig, reclamosConfig } from '../lib/dashboardConfigs';

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);


  // Función para manejar el retiro de paquetes
  const handleRetirePackage = async (packageId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('No hay token de autenticación');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/paquetes/${packageId}/retirar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Paquete retirado exitosamente');
        // Trigger refresh del dashboard
        setRefreshTrigger(prev => prev + 1);
      } else {
        alert(data.error || 'Error al retirar el paquete');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión al retirar el paquete');
    }
  };

  // Función para manejar reclamos
  const handleComplaintPackage = (packageId: number) => {
    // Redirigir a página de reclamos o abrir modal
    window.location.href = `/reclamos/nuevo?paquete=${packageId}`;
  };

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
    const toastId = showLoadingToast("Cargando usuarios...");
    
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
      hideLoadingToast(toastId);
    }
  };

  const fetchPaquetes = async () => {
    const toastId = showLoadingToast("Cargando paquetes...");
    
    try {
      const token = localStorage.getItem("authToken");
      
      if (!token) {
        console.error("No hay token disponible");
        return;
      }
      
      console.log("Obteniendo paquetes...");

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
      hideLoadingToast(toastId);
    }
  };

  const handleLogout = () => {
    const toastId = showLoadingToast("Cerrando sesión...");
    
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    
    setTimeout(() => {
      hideLoadingToast(toastId);
      router.push("/login");
    }, 500);
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
    fetchPaquetes();
  };

  const loadUsuarios = () => {
    fetchUsers();
  };

  return (
    <RouteGuard adminOnly={true}>
      <div className="min-h-screen bg-slate-100 px-6 py-10">
        {/* Contenedor para las notificaciones toast */}
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} />
        
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-zinc-800 mb-1">Panel de Administrador</h1>
          <div>
            <p className="text-gray-500 text-sm">
              Bienvenido/a, <span className="font-semibold">{userData?.nombre} {userData?.apellido}</span>
            </p>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-5 py-1 rounded-md shadow-md transition"
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
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "usuarios"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Usuarios
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("paquetes")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "paquetes"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Paquetes
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("registrar")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "registrar"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Registrar paquete
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("registrar-usuario")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "registrar-usuario"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Registrar usuario
              </button>
            </li>
            <li className="mr-2">
              <button
                onClick={() => setActiveTab("reclamos")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  activeTab === "reclamos"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Reclamos
              </button>
            </li>
          </ul>
        </div>

        {/* Contenido de la pestaña de usuarios */}
        {activeTab === "usuarios" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-zinc-800">Lista de usuarios</h2>
            <div className="mb-4">
              <button 
                onClick={loadUsuarios}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
              >
                Actualizar lista
              </button>
            </div>
            {isLoadingUsers ? (
              <div className="flex justify-center py-10">
                <p>Cargando usuarios...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border text-zinc-950">
                {users.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Nombre completo
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Departamento
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          RUT
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-zinc-600 uppercase tracking-wider">
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

        {/* Dashboard */}
        {activeTab == "paquetes" && (
          <div className="container mx-auto px-4 py-6">
      <Dashboard 
        config={paquetesConfig}
        viewMode="table" // o "cards"
        showPackageDetails={true} // Habilita vista de tarjetas
        onRetirePackage={handleRetirePackage} // Callback para retiros
        onComplaintPackage={handleComplaintPackage} // Callback para reclamos
        refreshInterval={30000}
      />
    </div>
        )}
        {/* Dashboard */}
        {activeTab == "reclamos" && (
          <div className="container mx-auto px-4 py-6">
      <Dashboard 
        config={reclamosConfig}
        viewMode="table" // o "cards"
        showPackageDetails={true} // Habilita vista de tarjetas
        onRetirePackage={handleRetirePackage} // Callback para retiros
        onComplaintPackage={handleComplaintPackage} // Callback para reclamos
        refreshInterval={30000*2*5}
      />
    </div>
        )}

        {/* Contenido de la pestaña de registro de paquetes */}
        {activeTab === "registrar" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-zinc-800">Registrar nuevo paquete</h2>
            <RegistroPaqueteForm onSuccess={refreshPaquetes} />
          </div>
        )}
        {/* Contenido de la pestaña de registro de usuarios */}
        {activeTab === "registrar-usuario" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6 text-zinc-800">Registrar nuevo usuario</h2>
            <RegistroUsuarioForm onSuccess={loadUsuarios} />
          </div>
        )}

      </div>
    </RouteGuard>
  );
}