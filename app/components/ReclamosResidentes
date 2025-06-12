'use client';

import React, { useState } from 'react';
import { AlertTriangle, FileText, Clock, User, Package, Send, X, CheckCircle, Phone, Mail } from 'lucide-react';

// Componente principal de reclamos
const ClaimsModal = ({ 
  packageData, 
  isOpen, 
  onClose, 
  onSubmitClaim 
}) => {
  const [formData, setFormData] = useState({
    claimType: '',
    description: '',
    contactPhone: '',
    contactEmail: '',
    residentName: '',
    apartmentNumber: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // Tipos de reclamo disponibles
  const CLAIM_TYPES = [
    { 
      id: 'damaged', 
      label: 'Paquete dañado', 
      icon: Package,
      description: 'El paquete llegó con daños visibles'
    },
    { 
      id: 'missing', 
      label: 'Paquete perdido', 
      icon: AlertTriangle,
      description: 'No se ha recibido el paquete esperado'
    },
    { 
      id: 'delay', 
      label: 'Retraso en entrega', 
      icon: Clock,
      description: 'El paquete no fue entregado en el tiempo esperado'
    },
    { 
      id: 'wrong_recipient', 
      label: 'Entrega incorrecta', 
      icon: User,
      description: 'Fue entregado a la persona equivocada'
    },
    { 
      id: 'other', 
      label: 'Otro motivo', 
      icon: FileText,
      description: 'Otro tipo de problema no listado'
    }
  ];

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.claimType) {
      newErrors.claimType = 'Debe seleccionar un tipo de reclamo';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }
    
    if (!formData.residentName.trim()) {
      newErrors.residentName = 'El nombre del residente es obligatorio';
    }
    
    if (!formData.apartmentNumber.trim()) {
      newErrors.apartmentNumber = 'El número de departamento es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los inputs
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Enviar reclamo
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const claimPayload = {
        id: `CLAIM-${Date.now()}`,
        packageId: packageData.id,
        trackingNumber: packageData.trackingNumber,
        timestamp: new Date().toISOString(),
        status: 'pending',
        ...formData
      };
      
      // Callback para manejar el envío
      if (onSubmitClaim) {
        await onSubmitClaim(claimPayload);
      }
      
      setShowSuccess(true);
      
      // Auto-cerrar después de mostrar éxito
      setTimeout(() => {
        handleClose();
      }, 3000);
      
    } catch (error) {
      console.error('Error al enviar reclamo:', error);
      alert('Error al enviar el reclamo. Por favor intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cerrar modal y resetear formulario
  const handleClose = () => {
    setFormData({
      claimType: '',
      description: '',
      priority: 'medium',
      contactPhone: '',
      contactEmail: '',
      residentName: '',
      apartmentNumber: ''
    });
    setErrors({});
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Crear Reclamo</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Paquete #{packageData?.trackingNumber || packageData?.id}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {showSuccess ? (
          /* Success State */
          <div className="p-12 text-center">
            <div className="mx-auto mb-6 p-4 bg-green-100 rounded-full w-fit">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Reclamo enviado exitosamente!
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Tu reclamo ha sido registrado y será procesado por el equipo de administración.
              Recibirás una notificación con el estado de tu solicitud.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg inline-block">
              <div className="text-sm text-gray-500 mb-1">Número de reclamo:</div>
              <div className="font-mono text-lg font-semibold text-gray-900">
                #{Date.now().toString().slice(-8)}
              </div>
            </div>
          </div>
        ) : (
          /* Form Content */
          <div className="p-6 space-y-8">
            {/* Package Information Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="w-5 h-5 mr-2 text-blue-600" />
                Información del Paquete
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem 
                  label="Número de seguimiento" 
                  value={packageData?.trackingNumber || 'N/A'} 
                />
                <InfoItem 
                  label="Fecha de recepción" 
                  value={packageData?.receivedDate ? 
                    new Date(packageData.receivedDate).toLocaleDateString('es-CL') : 
                    'N/A'
                  } 
                />
                <InfoItem 
                  label="Remitente" 
                  value={packageData?.sender || 'N/A'} 
                />
                <InfoItem 
                  label="Estado actual" 
                  value={packageData?.status || 'N/A'} 
                />
              </div>
            </div>

            {/* Resident Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Nombre del Residente"
                required
                error={errors.residentName}
              >
                <input
                  type="text"
                  value={formData.residentName}
                  onChange={(e) => handleInputChange('residentName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.residentName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ingresa tu nombre completo"
                />
              </FormField>
              
              <FormField
                label="Número de Departamento"
                required
                error={errors.apartmentNumber}
              >
                <input
                  type="text"
                  value={formData.apartmentNumber}
                  onChange={(e) => handleInputChange('apartmentNumber', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    errors.apartmentNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 401, 12B, etc."
                />
              </FormField>
            </div>

            {/* Claim Type Selection */}
            <FormField
              label="Tipo de Reclamo"
              required
              error={errors.claimType}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLAIM_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = formData.claimType === type.id;
                  
                  return (
                    <label
                      key={type.id}
                      className={`relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="claimType"
                        value={type.id}
                        checked={isSelected}
                        onChange={(e) => handleInputChange('claimType', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center mb-2">
                        <IconComponent className={`w-5 h-5 mr-3 ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                        <span className="font-medium text-gray-900">{type.label}</span>
                      </div>
                      <span className="text-sm text-gray-600">{type.description}</span>
                    </label>
                  );
                })}
              </div>
            </FormField>

            {/* Priority Selection */}
            <FormField label="Nivel de Prioridad">
              <div className="flex flex-wrap gap-3">
                {PRIORITY_LEVELS.map((priority) => {
                  const isSelected = formData.priority === priority.id;
                  
                  return (
                    <label
                      key={priority.id}
                      className={`px-6 py-3 border-2 rounded-lg cursor-pointer transition-all font-medium ${
                        isSelected
                          ? priority.selectedColor
                          : `${priority.color} hover:opacity-80`
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority.id}
                        checked={isSelected}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="sr-only"
                      />
                      {priority.label}
                    </label>
                  );
                })}
              </div>
            </FormField>

            {/* Description */}
            <FormField
              label="Descripción del Problema"
              required
              error={errors.description}
            >
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe detalladamente el problema con tu paquete. Incluye cualquier información relevante que pueda ayudar a resolver el reclamo..."
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {formData.description.length}/500 caracteres
              </div>
            </FormField>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Teléfono de Contacto">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </FormField>
              
              <FormField label="Email de Contacto">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="tu.email@ejemplo.com"
                  />
                </div>
              </FormField>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.claimType || !formData.description.trim()}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 font-medium min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Enviar Reclamo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente auxiliar para mostrar información del paquete
const InfoItem = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-600 mb-1">{label}:</div>
    <div className="font-medium text-gray-900">{value}</div>
  </div>
);

// Componente auxiliar para campos de formulario
const FormField = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-3">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-2 text-sm text-red-600 flex items-center">
        <AlertTriangle className="w-4 h-4 mr-1" />
        {error}
      </p>
    )}
  </div>
);

// Hook personalizado para uso del componente
export const useClaimsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  
  return {
    isOpen,
    openModal,
    closeModal
  };
};

// Componente de ejemplo integrado
const PackageWithClaims = ({ packageData }) => {
  const { isOpen, openModal, closeModal } = useClaimsModal();

  const handleSubmitClaim = async (claimData) => {
    console.log('Enviando reclamo:', claimData);
    
    // Aquí hay que implementar api de reclamos 

    // const response = await fetch('/api/claims', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(claimData)
    // });
    
    return claimData;
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Paquete #{packageData.trackingNumber}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>De:</strong> {packageData.sender}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Recibido:</strong> {new Date(packageData.receivedDate).toLocaleDateString('es-CL')}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium mb-3">
              {packageData.status}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            ID: {packageData.id}
          </div>
          <button
            onClick={openModal}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Crear Reclamo</span>
          </button>
        </div>
      </div>

      <ClaimsModal
        packageData={packageData}
        isOpen={isOpen}
        onClose={closeModal}
        onSubmitClaim={handleSubmitClaim}
      />
    </>
  );
};

// Demo del sistema completo
const ClaimsDemo = () => {
  const samplePackages = [
    {
      id: 'PKG-001',
      trackingNumber: 'TN123456789',
      sender: 'Amazon Chile',
      receivedDate: '2025-06-10T10:30:00Z',
      status: 'En bodega'
    },
    {
      id: 'PKG-002',
      trackingNumber: 'TN987654321',
      sender: 'MercadoLibre',
      receivedDate: '2025-06-09T14:15:00Z',
      status: 'Entregado'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Gestión de Paquetes
          </h1>
          <p className="text-gray-600">
            Administración de paquetes y reclamos para edificios residenciales
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {samplePackages.map((pkg) => (
            <PackageWithClaims key={pkg.id} packageData={pkg} />
          ))}
        </div>
      </div>
    </div>
  );
};
