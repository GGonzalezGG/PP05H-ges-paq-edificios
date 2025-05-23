import { useState } from 'react';

interface RegistroUsuarioFormProps {
  onSuccess: () => void;
}

// Simulamos react-toastify para el ejemplo
const toast = {
  success: (message: string) => {
    console.log('SUCCESS:', message);
    alert('Éxito: ' + message);
  },
  error: (message: string) => {
    console.log('ERROR:', message);
    alert('Error: ' + message);
  }
};

export default function RegistroUsuarioForm({ onSuccess }: RegistroUsuarioFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    N_departamento: '',
    admin: false,
    rut: '',
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    retiro_compartido: false
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      // Simulamos el token para el ejemplo - en tu app real debería venir de localStorage
      const token = "example-token-123";
      
      if (!token) {
        toast.error("No hay token de autorización");
        return;
      }

      // Validaciones básicas
      if (!formData.username.trim()) {
        toast.error("El nombre de usuario es requerido");
        return;
      }

      if (!formData.password.trim() || formData.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      if (!formData.nombre.trim() || !formData.apellido.trim()) {
        toast.error("Nombre y apellido son requeridos");
        return;
      }

      if (!formData.rut.trim()) {
        toast.error("El RUT es requerido");
        return;
      }

      if (!formData.correo.trim() || !formData.correo.includes('@')) {
        toast.error("Ingrese un correo electrónico válido");
        return;
      }

      if (!formData.N_departamento.trim()) {
        toast.error("El número de departamento es requerido");
        return;
      }

      // Preparar datos para enviar (convertir booleans a 1/0)
      const dataToSend = {
        ...formData,
        admin: formData.admin ? 1 : 0,
        retiro_compartido: formData.retiro_compartido ? 1 : 0
      };

      console.log("Enviando datos:", dataToSend);

      const response = await fetch("http://localhost:8000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Error HTTP: ${response.status}`);
      }

      console.log("Usuario registrado:", result);
      toast.success(result.message || "Usuario registrado exitosamente");
      
      // Limpiar formulario
      setFormData({
        username: '',
        password: '',
        N_departamento: '',
        admin: false,
        rut: '',
        nombre: '',
        apellido: '',
        correo: '',
        telefono: '',
        retiro_compartido: false
      });

      // Llamar callback para refrescar lista
      onSuccess();

    } catch (error) {
      console.error("Error al registrar usuario:", error);
      toast.error(`Error al registrar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registro de Usuario</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre de usuario */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de usuario *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Apellido */}
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">
              Apellido *
            </label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* RUT */}
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">
              RUT *
            </label>
            <input
              type="text"
              id="rut"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="12.345.678-9"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Número de departamento */}
          <div>
            <label htmlFor="N_departamento" className="block text-sm font-medium text-gray-700 mb-1">
              Número de departamento *
            </label>
            <input
              type="text"
              id="N_departamento"
              name="N_departamento"
              value={formData.N_departamento}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Correo */}
          <div>
            <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico *
            </label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Teléfono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="admin"
              name="admin"
              checked={formData.admin}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="admin" className="ml-2 block text-sm text-gray-700">
              Es administrador
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="retiro_compartido"
              name="retiro_compartido"
              checked={formData.retiro_compartido}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="retiro_compartido" className="ml-2 block text-sm text-gray-700">
              Retiro compartido
            </label>
          </div>
        </div>

        {/* Botón de envío */}
        <div className="pt-6">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full md:w-auto px-6 py-3 rounded-md text-white font-medium transition ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {loading ? 'Registrando...' : 'Registrar usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}