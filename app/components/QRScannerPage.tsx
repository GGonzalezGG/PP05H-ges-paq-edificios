'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { showLoadingToast, hideLoadingToast } from './toastLoading';

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
  const [cameraScanning, setCameraScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [resultModal, setResultModal] = useState({ 
    isOpen: false, 
    result: null, 
    isSuccess: false 
  });
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [scannerError, setScannerError] = useState('');
  
  // Refs para manejar el scanner
  const html5QrcodeRef = useRef(null);
  const scannerStateRef = useRef({
    isScanning: false,
    scanner: null
  });

  // Obtener cámaras disponibles
  useEffect(() => {
    const getCameras = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        console.log('Cámaras disponibles:', devices);
        setCameras(devices);
        if (devices.length > 0) {
          setSelectedCamera(devices[0].id);
        }
      } catch (error) {
        console.error('Error obteniendo cámaras:', error);
        setScannerError('No se pudieron obtener las cámaras disponibles');
      }
    };

    getCameras();
  }, []);

  // Función para limpiar el scanner de forma segura
  // 3. Mejora la función de limpieza
  const cleanupScanner = useCallback(async () => {
    if (scannerStateRef.current.scanner && scannerStateRef.current.isScanning) {
      try {
        await scannerStateRef.current.scanner.stop();
        await scannerStateRef.current.scanner.clear();
      } catch (error) {
        console.error('Error al limpiar scanner:', error);
      } finally {
        scannerStateRef.current.isScanning = false;
        scannerStateRef.current.scanner = null;
      }
    }
  }, []);

  // 1. Nuevo efecto para limpiar el scanner al cambiar de cámara
  useEffect(() => {
    const initCamera = async () => {
      if (selectedCamera && !cameraScanning) {
        await cleanupScanner();
      }
    };
    initCamera();
  }, [selectedCamera]);

  // Función para procesar escaneo manual
  const handleManualScan = async () => {
    if (!qrCode.trim()) {
      alert('Por favor, ingresa un código QR válido');
      return;
    }

    await processScanCode(qrCode.trim());
  };

  // Función para iniciar escaneo con cámara
  // 2. Modifica la función startCameraScan
  const startCameraScan = async () => {
    if (!selectedCamera) return;
    
    await cleanupScanner();
    try {
      setCameraScanning(true);
      setScannerError('');
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerStateRef.current.scanner = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false,
        },
        async (decodedText) => {
          await stopCameraScan();
          await processScanCode(decodedText);
        },
        (errorMessage) => {
          if (errorMessage && !errorMessage.includes('No QR code found')) {
            console.warn('Error de escaneo:', errorMessage);
          }
        }
      );
      scannerStateRef.current.isScanning = true;
    } catch (error) {
      console.error('Error iniciando cámara:', error);
      setScannerError('Error al acceder a la cámara. Verifica los permisos.');
      scannerStateRef.current.isScanning = false;
      scannerStateRef.current.scanner = null;
      setCameraScanning(false);
    }
  };

  // Función para detener escaneo con cámara
  const stopCameraScan = async () => {
    try {
      console.log('Deteniendo scanner...');
      setCameraScanning(false);
      
      if (scannerStateRef.current.scanner && scannerStateRef.current.isScanning) {
        await scannerStateRef.current.scanner.stop();
        console.log('Scanner detenido');
      }
      
      // Limpiar referencias
      scannerStateRef.current.isScanning = false;
      scannerStateRef.current.scanner = null;
      html5QrcodeRef.current = null;
      
    } catch (error) {
      console.error('Error deteniendo cámara:', error);
      // Forzar limpieza del estado incluso si hay error
      scannerStateRef.current.isScanning = false;
      scannerStateRef.current.scanner = null;
      html5QrcodeRef.current = null;
    } finally {
      setCameraScanning(false);
    }
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

      console.log('Procesando código:', code);

      const response = await fetch('http://localhost:8000/api/admin/scan-qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ codigoQR: code })
      });

      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      
      hideLoadingToast(toastId);

      if (result.success) {
        // Agregar al historial
        const newScan = {
          id: Date.now(),
          timestamp: new Date(),
          success: true,
          packageInfo: result.data
        };
        setScanHistory(prev => [newScan, ...prev.slice(0, 9)]);

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
      setQrCode('');
    }
  };

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      console.log('Componente desmontándose, limpiando scanner...');
      cleanupScanner();
    };
  }, [cleanupScanner]);

  // Cleanup cuando cambia la pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && cameraScanning) {
        console.log('Página oculta, deteniendo scanner...');
        stopCameraScan();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [cameraScanning]);

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
            
            {/* Error Display */}
            {scannerError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{scannerError}</p>
              </div>
            )}
            
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
                  disabled={scanning || cameraScanning}
                />
                <button
                  onClick={handleManualScan}
                  disabled={scanning || !qrCode.trim() || cameraScanning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                  {scanning ? 'Procesando...' : 'Escanear'}
                </button>
              </div>
            </div>

            {/* Camera Scanner */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Escaneo con Cámara
              </h3>
              
              {/* Camera Selection */}
              {cameras.length > 0 && (
                <div className="mb-4">
                  <label htmlFor="camera-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Cámara
                  </label>
                  <select
                    id="camera-select"
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    disabled={cameraScanning}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Cámara ${camera.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Contenedor de cámara modificado */}
            <div className="mb-4 relative">
              <div 
                id="qr-reader"
                className="w-full max-w-sm mx-auto bg-gray-100 rounded-lg overflow-hidden"
                style={{ minHeight: '250px' }}
              />
              
              {/* Placeholder superpuesto (no dentro del qr-reader) */}
              {!cameraScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-600 text-sm">Vista previa de la cámara</p>
                  </div>
                </div>
              )}
            </div>
            
              {/* Camera Controls */}
              <div className="flex gap-3 justify-center">
                {!cameraScanning ? (
                  <button
                    onClick={startCameraScan}
                    disabled={!selectedCamera || scanning || cameras.length === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Iniciar Cámara
                  </button>
                ) : (
                  <button
                    onClick={stopCameraScan}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Detener Cámara
                  </button>
                )}
              </div>

              {cameraScanning && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 text-center">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
                    Cámara activa - Enfoca el código QR
                  </p>
                </div>
              )}
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
                        <p>{scan.packageInfo?.destinatario} - {scan.packageInfo?.departamento}</p>
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