// app/components/RegistroPaqueteForm.tsx
"use client";

import { useState, useEffect } from "react";
import { ToastContainer } from 'react-toastify';
import { showLoadingToast, hideLoadingToast } from '../components/toastLoading';
import 'react-toastify/dist/ReactToastify.css';

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  N_departamento: string;
}

export default function RegistroPaqueteForm() {
  const [departamento, setDepartamento] = useState("");
  const [idDestinatario, setIdDestinatario] = useState<number | "">("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [usuariosDepartamento, setUsuariosDepartamento] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    // Limpiar la selección de usuario cuando cambia el departamento
    setIdDestinatario("");
    setUsuariosDepartamento([]);
    
    if (departamento.trim()) {
      buscarUsuariosPorDepartamento();
    }
  }, [departamento]);

  const buscarUsuariosPorDepartamento = async () => {
    setLoading(true);
    const toastId = showLoadingToast("Buscando residentes...");
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMensaje({
          tipo: "error",
          texto: "No hay sesión activa, por favor inicie sesión nuevamente"
        });
        return;
      }

      const response = await fetch(
        `http://localhost:8000/api/users/departamento?departamento=${encodeURIComponent(departamento)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setUsuariosDepartamento(result.data);
        if (result.data.length === 0) {
          setMensaje({
            tipo: "warning",
            texto: "No se encontraron residentes en este departamento"
          });
        } else {
          setMensaje({ tipo: "", texto: "" });
        }
      } else {
        setMensaje({
          tipo: "error",
          texto: result.error || "Error al buscar usuarios por departamento"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({
        tipo: "error",
        texto: "Error de conexión al buscar usuarios"
      });
    } finally {
      hideLoadingToast(toastId);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!idDestinatario) {
      setMensaje({
        tipo: "error",
        texto: "Por favor seleccione un destinatario"
      });
      return;
    }

    if (!ubicacion.trim()) {
      setMensaje({
        tipo: "error",
        texto: "La ubicación del paquete es obligatoria"
      });
      return;
    }

    setLoading(true);
    const toastId = showLoadingToast("Registrando paquete...");
    
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMensaje({
          tipo: "error",
          texto: "No hay sesión activa, por favor inicie sesión nuevamente"
        });
        hideLoadingToast(toastId);
        return;
      }

      const paqueteData = {
        idDestinatario: Number(idDestinatario),
        fechaLimite: fechaLimite || null,
        ubicacion,
        descripcion: descripcion || null
      };

      const response = await fetch("http://localhost:8000/api/paquetes/registrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paqueteData)
      });

      const result = await response.json();
      
      if (result.success) {
        setMensaje({
          tipo: "success",
          texto: "Paquete registrado correctamente"
        });
        
        // Reiniciar formulario
        setDepartamento("");
        setIdDestinatario("");
        setFechaLimite("");
        setUbicacion("");
        setDescripcion("");
        setUsuariosDepartamento([]);
      } else {
        setMensaje({
          tipo: "error",
          texto: result.error || "Error al registrar el paquete"
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({
        tipo: "error",
        texto: "Error de conexión al registrar el paquete"
      });
    } finally {
      hideLoadingToast(toastId);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6">
      <ToastContainer />
      <h2 className="text-xl text-zinc-900 font-semibold mb-4">Registrar nuevo paquete</h2>
      
      {mensaje.texto && (
        <div 
          className={`mb-4 p-3 rounded ${
            mensaje.tipo === "error" ? "bg-red-100 text-red-700" : 
            mensaje.tipo === "success" ? "bg-green-100 text-green-700" :
            mensaje.tipo === "warning" ? "bg-yellow-100 text-yellow-700" : ""
          }`}
        >
          {mensaje.texto}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="departamento">
            Número de departamento *
          </label>
          <input
            type="text"
            id="departamento"
            value={departamento}
            onChange={(e) => setDepartamento(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
            placeholder="Ej: 101A"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="destinatario">
            Destinatario *
          </label>
          <select
            id="destinatario"
            value={idDestinatario}
            onChange={(e) => setIdDestinatario(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-400"
            disabled={usuariosDepartamento.length === 0}
            required
          >
            <option value="">Seleccione un destinatario</option>
            {usuariosDepartamento.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre} {usuario.apellido}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="fechaLimite">
            Fecha límite de retiro (opcional)
          </label>
          <input
            type="datetime-local"
            id="fechaLimite"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-400"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="ubicacion">
            Ubicación del paquete *
          </label>
          <input
            type="text"
            id="ubicacion"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
            placeholder="Ej: Casillero 5, Conserjería"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="descripcion">
            Descripción (opcional)
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-700"
            placeholder="Ej: Paquete de Amazon, caja mediana"
            rows={3}
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          disabled={loading}
        >
        {loading ? "Registrando..." : "Registrar paquete"}
        </button>
      </form>
    </div>
  );
}