'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Importación dinámica del componente PackageDisplay sin SSR
const PackageDisplay = dynamic(
  () => import('../components/PackageDisplay'),
  { 
    ssr: false,
    loading: () => <div className="bg-gray-100 p-6 rounded-lg border animate-pulse">Cargando paquete...</div>
  }
);


const ResidentePage = () => {
  // Datos de prueba - incluye paquetes retirados y pendientes
  const testPackageData: PackageData[] = [
    // Paquete retirado (el que proporcionaste)
    {
      paquete: {
        ID_pack: 124,
        ID_userDestinatario: 2,
        ID_userRetirador: 3,
        fecha_entrega: '2024-03-10T14:20:00Z',
        fecha_retiro: '2024-03-12T16:45:00Z',
        ubicacion: 'Casilleros Planta Baja'
      },
      destinatario: {
        ID_usuario: 2,
        nombre: 'María',
        apellido: 'González',
        N_departamento: '2A',
        retiro_compartido: true
      },
      retirador: {
        ID_usuario: 3,
        nombre: 'Carlos',
        apellido: 'González',
        N_departamento: '2A',
        retiro_compartido: true
      },
      notificacion: {
        ID_notificacion: 2,
        ID_pack: 124,
        mensaje: 'Paquete de MercadoLibre con ropa y accesorios.',
        fecha_envio: '2024-03-10T14:20:00Z',
        leido: true
      }
    },
    // Paquete pendiente 1
    {
      paquete: {
        ID_pack: 125,
        ID_userDestinatario: 1,
        fecha_entrega: '2024-03-15T09:30:00Z',
        fecha_limite: '2024-03-22T18:00:00Z',
        ubicacion: 'Recepción Principal'
      },
      destinatario: {
        ID_usuario: 1,
        nombre: 'Ana',
        apellido: 'Martínez',
        N_departamento: '1B',
        retiro_compartido: false
      },
      notificacion: {
        ID_notificacion: 3,
        ID_pack: 125,
        mensaje: 'Paquete de Amazon con libros y material de oficina. Favor retirar antes del viernes.',
        fecha_envio: '2024-03-15T09:30:00Z',
        leido: false
      }
    },
    // Paquete pendiente 2
    {
      paquete: {
        ID_pack: 126,
        ID_userDestinatario: 4,
        fecha_entrega: '2024-03-16T11:15:00Z',
        ubicacion: 'Casilleros Segundo Piso'
      },
      destinatario: {
        ID_usuario: 4,
        nombre: 'Roberto',
        apellido: 'Silva',
        N_departamento: '3C',
        retiro_compartido: true
      },
      notificacion: {
        ID_notificacion: 4,
        ID_pack: 126,
        mensaje: 'Sobre certificado de Correos de Chile.',
        fecha_envio: '2024-03-16T11:15:00Z',
        leido: true
      }
    },
    // Paquete retirado 2
    {
      paquete: {
        ID_pack: 123,
        ID_userDestinatario: 5,
        ID_userRetirador: 5,
        fecha_entrega: '2024-03-08T16:00:00Z',
        fecha_retiro: '2024-03-09T10:30:00Z',
        ubicacion: 'Recepción Principal'
      },
      destinatario: {
        ID_usuario: 5,
        nombre: 'Laura',
        apellido: 'Rodríguez',
        N_departamento: '4A',
        retiro_compartido: false
      },
      retirador: {
        ID_usuario: 5,
        nombre: 'Laura',
        apellido: 'Rodríguez',
        N_departamento: '4A',
        retiro_compartido: false
      },
      notificacion: {
        ID_notificacion: 1,
        ID_pack: 123,
        mensaje: 'Paquete de Falabella con productos de belleza y cuidado personal.',
        fecha_envio: '2024-03-08T16:00:00Z',
        leido: true
      }
    }
  ];

  // Handlers para las acciones
  const handleRetirePackage = (packageId: number) => {
    console.log(`Intentando retirar paquete ID: ${packageId}`);
    alert(`Funcionalidad de retiro para paquete ${packageId} - Aquí implementarías la lógica de retiro`);
  };

  const handleComplaint = (packageId: number) => {
    console.log(`Dejando reclamo para paquete ID: ${packageId}`);
    alert(`Funcionalidad de reclamo para paquete ${packageId} - Aquí implementarías la lógica de reclamos`);
  };

  // Separar paquetes por estado
  const pendingPackages = testPackageData.filter(pkg => !pkg.paquete.fecha_retiro);
  const pickedUpPackages = testPackageData.filter(pkg => pkg.paquete.fecha_retiro);

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
                <p className="text-2xl font-bold text-gray-900">{testPackageData.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Packages Section */}
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
        {testPackageData.length === 0 && (
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

      {/* Debug Info (solo para desarrollo) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h3>
          <p className="text-xs text-gray-600">
            Total de paquetes de prueba: {testPackageData.length} | 
            Pendientes: {pendingPackages.length} | 
            Retirados: {pickedUpPackages.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResidentePage;