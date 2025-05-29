"use client";

import { useState } from "react";

interface Reclamo {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  fechaResolucion?: string;
  usuarioId: string;
}

export default function ReclamosPanel() {
  const [reclamos, setReclamos] = useState<Reclamo[]>([
    {
      id: "1",
      titulo: "Ruido excesivo",
      descripcion: "Fiesta ruidosa en el depto 302.",
      estado: "pendiente",
      fechaCreacion: "2025-05-27",
      usuarioId: "u1",
    },
    {
      id: "2",
      titulo: "Luz quemada en pasillo",
      descripcion: "Luz fundida en el piso 5",
      estado: "resuelto",
      fechaCreacion: "2025-05-25",
      fechaResolucion: "2025-05-26",
      usuarioId: "u2",
    },
  ]);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Reclamos</h2>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition">
          Nuevo Reclamo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reclamos.map((r) => (
          <div key={r.id} className="bg-white shadow p-4 rounded-xl">
            <h3 className="text-lg font-semibold">{r.titulo}</h3>
            <p className="text-sm text-gray-600">{r.descripcion}</p>
            <div className="mt-2 text-sm">
              <span className="font-medium">Estado:</span>{" "}
              <span
                className={
                  r.estado === "pendiente"
                    ? "text-yellow-500"
                    : r.estado === "resuelto"
                    ? "text-green-500"
                    : "text-blue-500"
                }
              >
                {r.estado}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Creado: {r.fechaCreacion}
              {r.fechaResolucion && ` | Resuelto: ${r.fechaResolucion}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
