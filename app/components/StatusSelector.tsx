import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface StatusSelectorProps {
  currentStatus: string;
  itemId: number;
  onStatusChange: (id: number, newStatus: string) => void;
  disabled?: boolean;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  currentStatus, 
  itemId, 
  onStatusChange, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'en_revision', label: 'En Revisión', color: 'bg-blue-100 text-blue-800' },
    { value: 'completado', label: 'Completado', color: 'bg-green-100 text-green-800' }
  ];

  const currentOption = statusOptions.find(option => option.value === currentStatus) || statusOptions[0];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || disabled) return;
    
    setIsUpdating(true);
    setIsOpen(false);
    
    try {
      await onStatusChange(itemId, newStatus);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={`
          inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
          ${currentOption.color}
          ${disabled || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}
          transition-opacity
        `}
      >
        {isUpdating ? 'Actualizando...' : currentOption.label}
        {!disabled && !isUpdating && (
          <ChevronDown className="ml-1 h-3 w-3" />
        )}
      </button>

      {isOpen && !disabled && !isUpdating && (
        <div className="absolute top-full left-0 mt-1 min-w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="flex flex-col p-1 space-y-1"> {/* Contenedor vertical */}
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                className={`
                  w-full text-left px-3 py-2 text-xs hover:bg-gray-50 rounded
                  ${option.value === currentStatus ? 'bg-gray-100' : ''}
                `}
              >
                <div className={`inline-block px-2 py-1 rounded-full ${option.color}`}>
                  {option.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusSelector;