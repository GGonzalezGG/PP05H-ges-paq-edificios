'use client';

import React, { useState, useEffect } from 'react';

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageData: any;
  onSubmit: (complaintData: { packageId: number; description: string }) => Promise<void>;
}

const ComplaintModal: React.FC<ComplaintModalProps> = ({ 
  isOpen, 
  onClose, 
  packageData, 
  onSubmit 
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Limpiar formulario cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Manejar animaciones de entrada y salida
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      // Limpiar estado cuando se cierra
      setTimeout(() => {
        setDescription('');
        setError(null);
        setIsSubmitting(false);
      }, 300); // Esperar a que termine la animación de salida
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Por favor, describe tu reclamo');
      return;
    }

    if (description.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        packageId: packageData?.paquete?.ID_pack,
        description: description.trim()
      });
      
      // Limpiar formulario y cerrar modal
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Error al enviar reclamo:', error);
      setError('Error al enviar el reclamo. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejar el cierre con animación
  const handleClose = () => {
    if (!isSubmitting) {
      setIsAnimating(false);
      setTimeout(() => {
        onClose();
      }, 200);
    }
  };

  if (!isOpen && !isAnimating) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-300 ease-out ${
        isOpen && isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transition-all duration-300 ease-out transform ${
          isOpen && isAnimating 
            ? 'scale-100 translate-y-0 opacity-100' 
            : 'scale-95 translate-y-4 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-lg font-semibold text-gray-900 transition-all duration-400 ease-out ${
            isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
          }`}>Presentar Reclamo</h3>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className={`text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-all duration-200 hover:scale-110 transform ${
              isAnimating ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información del paquete */}
        <div className={`mb-4 p-4 bg-gray-50 rounded-lg transition-all duration-500 ease-out delay-100 ${
          isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
        }`}>
          <h4 className="font-medium text-gray-900 mb-2">Información del Paquete</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>ID:</strong> #{packageData?.paquete?.ID_pack}</p>
            <p><strong>Ubicación:</strong> {packageData?.paquete?.ubicacion}</p>
            <p><strong>Fecha de entrega:</strong> {
              packageData?.paquete?.fecha_entrega
                ? new Date(packageData.paquete.fecha_entrega).toLocaleDateString()
                : 'N/A'
            }</p>
            {packageData?.paquete?.fecha_retiro && (
              <p><strong>Fecha de retiro:</strong> {
                new Date(packageData.paquete.fecha_retiro).toLocaleDateString()
              }</p>
            )}
          </div>
        </div>

        {/* Formulario de reclamo */}
        <form onSubmit={handleSubmit}>
          <div className={`mb-4 transition-all duration-500 ease-out delay-200 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción del reclamo *
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe detalladamente tu reclamo sobre este paquete..."
              rows={4}
              className="w-full text-gray-600 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              disabled={isSubmitting}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-gray-500">
                Mínimo 10 caracteres
              </div>
              <div className="text-xs text-gray-500">
                {description.length}/500
              </div>
            </div>
          </div>

          {error && (
            <div className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-md transition-all duration-300 ease-out ${
              error ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
            }`}>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 transition-all duration-500 ease-out delay-300 ${
            isAnimating ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2 text-sm text-blue-800">
                <strong>Nota:</strong> Tu reclamo será revisado por el equipo de administración. Te contactaremos dentro de las próximas 24-48 horas.
              </div>
            </div>
          </div>

          <div className={`flex justify-end space-x-3 transition-all duration-500 ease-out delay-400 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 transform"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim() || description.trim().length < 10}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                'Enviar Reclamo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

};

export default ComplaintModal;
