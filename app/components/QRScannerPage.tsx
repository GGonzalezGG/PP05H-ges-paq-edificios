'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PackageData } from './PackageDisplay';
import { showLoadingToast, hideLoadingToast } from './toastLoading';

// Importación dinámica del componente PackageDisplay
const PackageDisplay = dynamic(
  () => import('./PackageDisplay'),
  { 
    ssr: false,
    loading: () => <div className="bg-gray-100 p-6 rounded-lg border animate-pulse">Cargando...</div>
  }
);

// Componente Modal para mostrar resultado del escaneo
const ScanResultModal = ({ isOpen, onClose, scanResult, isSuccess }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
            {isSuccess ? 'Paquete Retirado Exitosamente' : 'Error en el Escaneo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {isSuccess ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Paquete retirado correctamente
                  </h4>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Información del Paquete:</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Paquete #:</span>
                  <p className="text-gray-900">{scanResult?.ID_pack}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Destinatario:</span>
                  <p className="text-gray-900">{scanResult?.destinatario}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Departamento:</span>
                  <p className="text-gray-900">{scanResult?.departamento}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Ubicación:</span>
                  <p className="text-gray-900">{scanResult?.ubicacion}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Fecha Entrega:</span>
                  <p className="text-gray-900">
                    {scanResult?.fechaEntrega ? new Date(scanResult.fechaEntrega).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Retirado por:</span>
                  <p className="text-gray-900">{scanResult?.userRetirador}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">Error al procesar el código QR</h4>
                <p className="text-sm text-red-700 mt-1">{scanResult}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              isSuccess 
                ? 'text-green-700 bg-green-100 hover:bg-green-200' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal para escáner QR
const QRScannerPage = () => {
  const [qrCode, setQrCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [resultModal, setResultModal] = useState({ 
    isOpen: false, 
    result: null, 
    isSuccess: false 
  });

  // Función para procesar escaneo manual
  const handleManualScan = async () => {
    if (!qrCode.trim()) {
      alert('Por favor, ingresa un código QR válido');
      return;
    }

    await processScanCode(qrCode.trim());
  };

  // Función para procesar el código QR
  const processScanCode = async (code) => {
    const toastId = showLoadingToast("Procesando código QR...");
    setScanning(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('http://localhost:8000/api/admin/scan-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoQR: code })
      });

      const result = await response.json();
      
      hideLoadingToast(toastId);

      if (result.success) {
        // Agregar al historial
        const newScan = {
          id: Date.now(),
          timestamp: new Date(),
          success: true,
          packageInfo: result.data
        };
        setScanHistory(prev => [newScan, ...prev.slice(0, 9)]); // Mantener solo 10 registros

        // Mostrar modal de éxito
        setResultModal({
          isOpen: true,
          result: result.data,
          isSuccess: true
        });
      } else {
        // Mostrar modal de error
        setResultModal({
          isOpen: true,
          result: result.error,
          isSuccess: false
        });
      }
    } catch (error) {
      hideLoadingToast(toastId);
      console.error('Error al procesar QR:', error);
      setResultModal({
        isOpen: true,
        result: error.message || 'Error de conexión',
        isSuccess: false
      });
    } finally {
      setScanning(false);
      setQrCode(''); // Limpiar el input
    }
  };

  // Simular escaneo con cámara (placeholder)
  const handleCameraScan = () => {
    alert('Funcionalidad de cámara en desarrollo. Por ahora, usa el escaneo manual.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Escáner de Códigos QR
          </h1>
          <p className="mt-2 text-gray-600">
            Escanea códigos QR para retirar paquetes
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Escanear Código QR
            </h2>
            
            {/* Manual Input */}
            <div className="mb-6">
              <label htmlFor="qr-input" className="block text-sm font-medium text-gray-700 mb-2">
                Código QR Manual
              </label>
              <div className="flex gap-3">
                <input
                  id="qr-input"
                  type="text"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Pega o escribe el código QR aquí"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={scanning}
                />
                <button
                  onClick={handleManualScan}
                  disabled={scanning || !qrCode.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {scanning ? 'Procesando...' : 'Escanear'}
                </button>
              </div>
            </div>

            {/* Camera Scanner (Placeholder) */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Escaneo con Cámara
              </h3>
              <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">Funcionalidad de cámara en desarrollo</p>
                <button
                  onClick={handleCameraScan}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Activar Cámara
                </button>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Historial de Escaneos
            </h2>
            
            {scanHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-600">No hay escaneos recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {scanHistory.map((scan) => (
                  <div key={scan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          scan.success ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="font-medium text-gray-900">
                          {scan.success ? `Paquete #${scan.packageInfo?.ID_pack}` : 'Error'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {scan.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    {scan.success && (
                      <div className="text-sm text-gray-600 ml-6">
                        <p>{scan.packageInfo?.residente} - {scan.packageInfo?.departamento}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Result Modal */}
      <ScanResultModal
        isOpen={resultModal.isOpen}
        onClose={() => setResultModal({ isOpen: false, result: null, isSuccess: false })}
        scanResult={resultModal.result}
        isSuccess={resultModal.isSuccess}
      />
    </div>
  );
};

export default QRScannerPage;