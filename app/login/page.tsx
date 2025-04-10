"use client";

import { useState } from "react";


export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Logging in with:", { username, password });
    // Add authentication logic here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Inicio de sesión</h1>

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
            className="w-full rounded-full bg-green-600 p-2 text-white font-semibold hover:bg-green-700"
          >
            Iniciar sesión
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


