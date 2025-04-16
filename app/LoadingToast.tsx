/** @jsx h */
import { h } from "preact";
import { useEffect, useState } from "preact/hooks";

type Props = {
  isLoading: boolean;
};

export default function LoadingToast({ isLoading }: Props) {
  const [visible, setVisible] = useState(isLoading);

  useEffect(() => {
    setVisible(isLoading);
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      background: "rgba(0, 0, 0, 0.8)",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      zIndex: 1000,
    }}>
      <span class="spinner" style={{
        width: "16px",
        height: "16px",
        border: "2px solid #fff",
        borderTop: "2px solid transparent",
        borderRadius: "50%",
        marginRight: "10px",
        animation: "spin 1s linear infinite"
      }}></span>
      <span>Cargando paquetes…</span>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}




/* Para poder usarlo en otro archivo:
import { useState, useEffect } from "preact/hooks";
import LoadingToast from "./LoadingToast.tsx";

export default function PaquetesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [paquetes, setPaquetes] = useState([]);

  useEffect(() => {
    fetch("/api/paquetes") // Reemplazar con la ruta del api
      .then((res) => res.json())
      .then((data) => {
        setPaquetes(data);
        setIsLoading(false);
      });
  }, []);

  return (
    <div>
      <LoadingToast isLoading={isLoading} />
      <h1>Paquetes Recibidos</h1>
      {paquetes.map((p) => (
        <div key={p.id}>{p.nombre}</div>
      ))}
    </div>
  );
}
*/
