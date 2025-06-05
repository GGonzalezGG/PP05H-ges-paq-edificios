'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PackageData } from '../components/PackageDisplay';
import { useRouter } from "next/navigation";
import { showLoadingToast, hideLoadingToast } from '../components/toastLoading';


// Importación dinámica del componente PackageDisplay sin SSR
const PackageDisplay = dynamic(
  () => import('../components/PackageDisplay'),
  { 
    ssr: false,
    loading: () => <div className="bg-gray-100 p-6 rounded-lg border animate-pulse">Cargando paquete...</div>
  }
);

const ResidentePage = () => {
  const [packageData, setPackageData] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Función para obtener paquetes desde la API
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener token del localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await fetch('http://localhost:8000/api/resident/packages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setPackageData(result.data.packages);
      } else {
        setError(result.error || 'Error al cargar los paquetes');
        
        // Si el token es inválido, redirigir al login
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
      }
    } catch (err) {
      console.error('Error al obtener paquetes:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar paquetes al montar el componente
  useEffect(() => {
    fetchPackages();
  }, []);

  // Handlers para las acciones (placeholder por ahora)
  const handleRetirePackage = (packageId: number) => {
    console.log(`Intentando retirar paquete ID: ${packageId}`);
    alert(`Funcionalidad de retiro para paquete ${packageId} - Aquí implementarías la lógica de retiro`);
  };

  const handleComplaint = (packageId: number) => {
    console.log(`Dejando reclamo para paquete ID: ${packageId}`);
    alert(`Funcionalidad de reclamo para paquete ${packageId} - Aquí implementarías la lógica de reclamos`);
  };

  // Separar paquetes por estado
  const pendingPackages = packageData.filter(pkg => !pkg.paquete.fecha_retiro);
  const pickedUpPackages = packageData.filter(pkg => pkg.paquete.fecha_retiro);

  // Mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Portal del Residente</h1>
            <p className="mt-2 text-gray-600">Gestiona tus paquetes y encomiendas</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando paquetes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Portal del Residente</h1>
            <p className="mt-2 text-gray-600">Gestiona tus paquetes y encomiendas</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-red-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error al cargar paquetes</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchPackages}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Intentar nuevamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

    const handleLogout = () => {
      const toastId = showLoadingToast("Cerrando sesión...");
      
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      
      setTimeout(() => {
        hideLoadingToast(toastId);
        router.push("/login");
      }, 500);
    };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Portal del Residente
          </h1>
          <p className="mt-2 text-gray-600">
            Gestiona tus paquetes y encomiendas
          </p>
          <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-5 py-1 rounded-md shadow-md transition"
            >
              Cerrar sesión
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paquetes Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPackages.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Paquetes Retirados</p>
                <p className="text-2xl font-bold text-gray-900">{pickedUpPackages.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Paquetes</p>
                <p className="text-2xl font-bold text-gray-900">{packageData.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mb-6">
          <button
            onClick={fetchPackages}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Actualizando...' : 'Actualizar Paquetes'}
          </button>
        </div>

        {/* Pending Packages Section */}
        {pendingPackages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Paquetes Pendientes ({pendingPackages.length})
            </h2>
            <div className="space-y-4">
              {pendingPackages.map((packageData) => (
                <PackageDisplay
                  key={packageData.paquete.ID_pack}
                  packageData={packageData}
                  isPickedUp={false}
                  onRetireClick={handleRetirePackage}
                  onComplaintClick={handleComplaint}
                />
              ))}
            </div>
          </div>
        )}

        {/* Picked Up Packages Section */}
        {pickedUpPackages.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Paquetes Retirados ({pickedUpPackages.length})
            </h2>
            <div className="space-y-4">
              {pickedUpPackages.map((packageData) => (
                <PackageDisplay
                  key={packageData.paquete.ID_pack}
                  packageData={packageData}
                  isPickedUp={true}
                  onRetireClick={handleRetirePackage}
                  onComplaintClick={handleComplaint}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {packageData.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-300 rounded"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay paquetes disponibles
            </h3>
            <p className="text-gray-600">
              Cuando tengas paquetes, aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentePage;