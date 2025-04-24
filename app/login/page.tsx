"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("userData");
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        const redirectTo = user.admin ? "/admin" : "/residente";
        router.push(redirectTo);
      } catch (error) {
        console.error("Error al procesar datos de usuario:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      localStorage.setItem("authToken", data.data.token);
      localStorage.setItem("userData", JSON.stringify(data.data.user));
      router.push(data.data.redirectTo);
    } catch (error) {
      console.error("Error durante el login:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">Inicio de sesión</h1>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su nombre de usuario"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-600 focus:ring-green-600"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 placeholder-gray-400 focus:border-green-600 focus:ring-green-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full bg-green-600 p-2 text-white font-semibold hover:bg-green-700 disabled:bg-green-400"
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <button
            type="button"
            className="w-full rounded-full bg-gray-100 p-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            Olvidé mi contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
