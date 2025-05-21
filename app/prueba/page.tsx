"use client";

import { useState, useEffect } from "react";

interface User {
  id: number;
  username: string;
  password: string;
  N_departamento: number;
  admin: number;
  rut: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  retiro_compartido: number;
}

// URL de la API de Deno
const API_URL = "http://localhost:8000/api/users";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log("Fetching users from Deno API...");
        const response = await fetch(API_URL);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(
            `Error ${response.status}: ${errorData?.details || response.statusText}`
          );
        }
        
        const data = await response.json();
        console.log(`Received ${data.length} users from API`);
        setUsers(data);
      } catch (err) {
        setError(`Error al cargar usuarios: ${err instanceof Error ? err.message : String(err)}`);
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) {
    return <div className="p-4">Cargando usuarios...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Lista de Usuarios</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-zinc-950 py-2 px-4 border">ID</th>
              <th className="py-2 px-4 border text-zinc-950">Username</th>
              <th className="py-2 px-4 border text-zinc-950">Departamento</th>
              <th className="py-2 px-4 border text-zinc-950">Admin</th>
              <th className="py-2 px-4 border text-zinc-950">RUT</th>
              <th className="py-2 px-4 border text-zinc-950">Nombre</th>
              <th className="py-2 px-4 border text-zinc-950">Apellido</th>
              <th className="py-2 px-4 border text-zinc-950">Correo</th>
              <th className="py-2 px-4 border text-zinc-950">Teléfono</th>
              <th className="py-2 px-4 border text-zinc-950">Retiro Compartido</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border text-zinc-950">{user.id}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.username}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.N_departamento}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.admin === 1 ? "Sí" : "No"}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.rut}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.nombre}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.apellido}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.correo}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.telefono}</td>
                <td className="py-2 px-4 border text-zinc-950">{user.retiro_compartido === 1 ? "Sí" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="mt-4 text-gray-500 text-sm">Total de usuarios: {users.length}</p>
    </div>
  );
}