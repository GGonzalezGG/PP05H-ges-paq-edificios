'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PackageData } from '../components/PackageDisplay';
import { useRouter } from "next/navigation";
import { showLoadingToast, hideLoadingToast } from '../components/toastLoading';
import QRCode from 'qrcode';
import ComplaintModal from '../components/ComplainModal';

// Importación dinámica del componente PackageDisplay sin SSR
const PackageDisplay = dynamic(
  () => import('../components/PackageDisplay'),
  { 
    ssr: false,
    loading: () => <div className="bg-gray-100 p-6 rounded-lg border animate-pulse">Cargando paquete...</div>
  }
);

// Componente Modal para mostrar QR
const QRModal = ({ isOpen, onClose, qrData, packageData }) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [showQRText, setShowQRText] = useState(false);

  // Generar imagen QR cuando se abre el modal
  useEffect(() => {
    const generateQRImage = async () => {
      if (isOpen && qrData?.codigoQR) {
        setGenerating(true);
        try {
          const qrImageDataUrl = await QRCode.toDataURL(qrData.codigoQR, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrImageUrl(qrImageDataUrl);
        } catch (error) {
          console.error('Error generando QR:', error);
        } finally {
          setGenerating(false);
        }
      }
    };

    generateQRImage();
  }, [isOpen, qrData]);

  // Limpiar imagen cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setQrImageUrl('');
      setGenerating(false);
      setShowQRText(false);
    }
  }, [isOpen]);

  // Función para copiar el código QR al portapapeles
  const copyQRCode = async () => {
    if (qrData?.codigoQR) {
      try {
        await navigator.clipboard.writeText(qrData.codigoQR);
        alert('Código QR copiado al portapapeles');
      } catch (error) {
        console.error('Error al copiar:', error);
        alert('No se pudo copiar el código');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Código QR de Retiro</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="text-center">
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            {generating ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Generando QR...</span>
              </div>
            ) : qrImageUrl ? (
              <div className="flex flex-col items-center">
                <img 
                  src={qrImageUrl} 
                  alt="Código QR" 
                  className="mb-2 border-2 border-gray-300 rounded"
                />
                <p className="text-xs text-gray-500 mb-3">
                  Código QR único para retiro
                </p>
                
                {/* Botón para mostrar/ocultar el texto del código QR */}
                <button
                  onClick={() => setShowQRText(!showQRText)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline mb-2"
                >
                  {showQRText ? 'Ocultar código' : 'Ver código como texto'}
                </button>
                
                {/* Mostrar el texto del código QR */}
                {showQRText && qrData?.codigoQR && (
                  <div className="mt-3 p-3 bg-white border-2 border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 mb-2 font-medium">Código QR:</p>
                    <div className="relative">
                      <code className="text-xs font-mono text-gray-800 break-all bg-gray-50 p-2 rounded block">
                        {qrData.codigoQR}
                      </code>
                      <button
                        onClick={copyQRCode}
                        className="absolute top-1 right-1 p-1 text-gray-500 hover:text-gray-700 bg-white rounded border"
                        title="Copiar código"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-4xl font-mono text-center p-4 bg-white border-2 border-dashed border-gray-300 rounded">
                {qrData?.codigoQR || 'QR CODE'}
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Paquete:</strong> #{packageData?.paquete?.ID_pack}</p>
            <p><strong>Ubicación:</strong> {packageData?.paquete?.ubicacion}</p>
            <p><strong>Expira:</strong> {qrData?.fechaExpiracion ? new Date(qrData.fechaExpiracion).toLocaleString() : 'N/A'}</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            <p><strong>Instrucciones:</strong></p>
            <p>Muestra este código al conserje o administrador para retirar tu paquete. El código expira en 24 horas.</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end space-x-3">
          {qrImageUrl && (
            <a
              href={qrImageUrl}
              download={`QR-Paquete-${packageData?.paquete?.ID_pack}.png`}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
            >
              Descargar QR
            </a>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

const ResidentePage = () => {
  const [packageData, setPackageData] = useState<PackageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState({ isOpen: false, qrData: null, packageData: null });
  const router = useRouter();
  const [complaintModal, setComplaintModal] = useState({ isOpen: false, packageData: null });

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

  // Función para generar código QR
  const handleRetirePackage = async (packageId: number) => {
    const toastId = showLoadingToast("Generando código QR...");
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No hay sesión activa. Por favor, inicia sesión.');
        return;
      }

      const response = await fetch('http://localhost:8000/api/resident/generate-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paqueteId: packageId })
      });

      const result = await response.json();

      if (result.success) {
        hideLoadingToast(toastId);
        
        // Encontrar los datos del paquete
        const packageInfo = packageData.find(pkg => pkg.paquete.ID_pack === packageId);
        
        // Mostrar modal con QR
        setQrModal({
          isOpen: true,
          qrData: result.data,
          packageData: packageInfo
        });
      } else {
        hideLoadingToast(toastId);
        alert(`Error al generar código QR: ${result.error}`);
      }
    } catch (error) {
      hideLoadingToast(toastId);
      console.error('Error al generar código QR:', error);
      alert('Error de conexión al generar código QR');
    }
  };

  const handleComplaint = (packageId: number) => {
  const packageInfo = packageData.find(pkg => pkg.paquete.ID_pack === packageId);
  setComplaintModal({
    isOpen: true,
    packageData: packageInfo
  });
};

const handleSubmitComplaint = async (complaintData: { packageId: number; description: string }) => {
  const toastId = showLoadingToast("Enviando reclamo...");
  
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch('http://localhost:8000/api/resident/complaint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId: complaintData.packageId,
        description: complaintData.description
      })
    });

    const result = await response.json();

    if (result.success) {
      hideLoadingToast(toastId);
      alert('Reclamo enviado exitosamente. Te contactaremos pronto.');
    } else {
      hideLoadingToast(toastId);
      throw new Error(result.error || 'Error al enviar el reclamo');
    }
  } catch (error) {
    hideLoadingToast(toastId);
    console.error('Error al enviar reclamo:', error);
    throw error; // Re-lanzar el error para que el modal lo maneje
  }
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Portal del Residente
              </h1>
              <p className="mt-2 text-gray-600">
                Gestiona tus paquetes y encomiendas
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-5 py-2 rounded-md shadow-md transition"
            >
              Cerrar sesión
            </button>
          </div>
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

        {/* Complaint Modal */}
          <ComplaintModal
            isOpen={complaintModal.isOpen}
            onClose={() => setComplaintModal({ isOpen: false, packageData: null })}
            packageData={complaintModal.packageData}
            onSubmit={handleSubmitComplaint}
          />

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

      {/* QR Modal */}
      <QRModal
        isOpen={qrModal.isOpen}
        onClose={() => setQrModal({ isOpen: false, qrData: null, packageData: null })}
        qrData={qrModal.qrData}
        packageData={qrModal.packageData}
      />
    </div>
  );
};

export default ResidentePage;