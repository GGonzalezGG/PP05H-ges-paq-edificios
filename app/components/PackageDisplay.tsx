//app/components/PackageDisplay.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Package, MapPin, Calendar, User, AlertTriangle } from 'lucide-react';

// TypeScript interfaces
export interface Usuario {
  ID_usuario: number;
  nombre: string;
  apellido: string;
  N_departamento: string;
  retiro_compartido: boolean;
}

export interface Paquete {
  ID_pack: number;
  ID_userDestinatario: number;
  ID_userRetirador?: number;
  fecha_entrega: string;
  fecha_limite?: string;
  fecha_retiro?: string;
  ubicacion: string;
}

export interface Notificacion {
  ID_notificacion: number;
  ID_pack: number;
  mensaje: string;
  fecha_envio: string;
  leido: boolean;
}

export interface PackageData {
  paquete: Paquete;
  destinatario: Usuario;
  retirador?: Usuario;
  notificacion?: Notificacion;
}

interface PackageDisplayProps {
  packageData: PackageData;
  isPickedUp: boolean;
  onRetireClick?: (packageId: number) => void;
  onComplaintClick?: (packageId: number) => void;
}

const PackageDisplay: React.FC<PackageDisplayProps> = ({
  packageData,
  isPickedUp,
  onRetireClick,
  onComplaintClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { paquete, destinatario, retirador, notificacion } = packageData;

  // Format dates for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get package identifier display
  const getPackageIdentifier = (): string => {
    return `PKG-${paquete.ID_pack.toString().padStart(4, '0')}`;
  };

  // Handle retire package action
  const handleRetireClick = () => {
    if (onRetireClick) {
      onRetireClick(paquete.ID_pack);
    }
  };

  // Handle complaint action
  const handleComplaintClick = () => {
    if (onComplaintClick) {
      onComplaintClick(paquete.ID_pack);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
      {/* Summary Header - Always Visible */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-2 rounded-full ${isPickedUp ? 'bg-green-100' : 'bg-blue-100'}`}>
              <Package className={`w-5 h-5 ${isPickedUp ? 'text-green-600' : 'text-blue-600'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 text-lg">
                  {getPackageIdentifier()}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isPickedUp 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {isPickedUp ? 'Retirado' : 'Pendiente'}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{paquete.ubicacion}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Entregado: {formatDate(paquete.fecha_entrega)}</span>
                </div>
                {isPickedUp && paquete.fecha_retiro && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Retirado: {formatDate(paquete.fecha_retiro)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {isPickedUp && retirador && (
              <div className="hidden sm:flex items-center space-x-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                <User className="w-4 h-4" />
                <span>{retirador.nombre} {retirador.apellido}</span>
              </div>
            )}
            <button className="p-1 hover:bg-gray-100 rounded transition-colors duration-150">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          {/* Package Details */}
          <div className="space-y-4">
            {/* Recipient Information */}
            <div className="bg-white p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Información del Destinatario</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Nombre:</strong> {destinatario.nombre} {destinatario.apellido}</p>
                <p><strong>Departamento:</strong> {destinatario.N_departamento}</p>
              </div>
            </div>

            {/* Pickup Information (for picked-up packages) */}
            {isPickedUp && retirador && (
              <div className="bg-white p-3 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Información de Retiro</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Retirado por:</strong> {retirador.nombre} {retirador.apellido}</p>
                  <p><strong>Departamento:</strong> {retirador.N_departamento}</p>
                  {paquete.fecha_retiro && (
                    <p><strong>Fecha de retiro:</strong> {formatDate(paquete.fecha_retiro)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Notification Message */}
            {notificacion && (
              <div className="bg-white p-3 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">Descripción</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {notificacion.mensaje}
                </p>
              </div>
            )}

            {/* Additional Package Details */}
            <div className="bg-white p-3 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Detalles del Paquete</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>ID del Paquete:</strong> {paquete.ID_pack}</p>
                <p><strong>Ubicación:</strong> {paquete.ubicacion}</p>
                <p><strong>Fecha de entrega:</strong> {formatDate(paquete.fecha_entrega)}</p>
                {paquete.fecha_limite && (
                  <p><strong>Fecha límite:</strong> {formatDate(paquete.fecha_limite)}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Pick Up Button (only for pending packages) */}
              {!isPickedUp && (
                <button
                  onClick={handleRetireClick}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex-1 sm:flex-none"
                >
                  <Package className="w-4 h-4" />
                  <span>Retirar Paquete</span>
                </button>
              )}

              {/* Complaint Button (always available) */}
              <button
                onClick={handleComplaintClick}
                className="flex items-center justify-center space-x-2 bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg font-medium transition-colors duration-200 border border-orange-200 flex-1 sm:flex-none"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Dejar Reclamo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageDisplay;