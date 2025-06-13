
import React, { useState, useEffect } from 'react';
import { Package, Clock, AlertTriangle, CheckCircle, XCircle, Grid, List } from 'lucide-react';
import PackageDisplay, { PackageData } from './PackageDisplay';

// Tipos para los datos del dashboard
interface DashboardItem {
  id: number;
  idDestinatario?: number;
  idRetirador?: number;
  fechaEntrega?: string;
  fechaLimite?: string;
  fechaRetiro?: string;
  ubicacion?: string;
  nombreDestinatario?: string;
  apellidoDestinatario?: string;
  departamento?: string;
  nombreRetirador?: string;
  apellidoRetirador?: string;
  // Para reclamos (extensible)
  tipo?: string;
  estado?: string;
  descripcion?: string;
  fechaCreacion?: string;
}

interface DashboardConfig {
  title: string;
  endpoint: string;
  itemType: 'paquete' | 'reclamo';
  columns: {
    key: string;
    label: string;
    render?: (item: DashboardItem) => React.ReactNode;
  }[];
  statusConfig: {
    getStatus: (item: DashboardItem) => 'pending' | 'delivered' | 'expired' | 'processing';
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
  };
}

interface DashboardProps {
  config: DashboardConfig;
  refreshInterval?: number;
  viewMode?: 'table' | 'cards';
  showPackageDetails?: boolean;
  onRetirePackage?: (packageId: number) => void;
  onComplaintPackage?: (packageId: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  config, 
  refreshInterval = 30000, // 30 segundos por defecto
  viewMode = 'table',
  showPackageDetails = false,
  onRetirePackage,
  onComplaintPackage
}) => {
  const [items, setItems] = useState<DashboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentViewMode, setCurrentViewMode] = useState<'table' | 'cards'>(viewMode);

  // Función para obtener datos del servidor
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch(`http://localhost:8000${config.endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setItems(data.data || []);
        setLastUpdate(new Date());
        setError(null);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error al obtener datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos inicial y configurar refresh automático
  useEffect(() => {
    fetchData();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [config.endpoint, refreshInterval]);

  // Función para formatear fecha
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Función para convertir DashboardItem a PackageData
  const convertToPackageData = (item: DashboardItem): PackageData => {
    return {
      paquete: {
        ID_pack: item.id,
        ID_userDestinatario: item.idDestinatario || 0,
        ID_userRetirador: item.idRetirador,
        fecha_entrega: item.fechaEntrega || '',
        fecha_limite: item.fechaLimite,
        fecha_retiro: item.fechaRetiro,
        ubicacion: item.ubicacion || ''
      },
      destinatario: {
        ID_usuario: item.idDestinatario || 0,
        nombre: item.nombreDestinatario || '',
        apellido: item.apellidoDestinatario || '',
        N_departamento: item.departamento || '',
        retiro_compartido: false
      },
      retirador: item.idRetirador ? {
        ID_usuario: item.idRetirador,
        nombre: item.nombreRetirador || '',
        apellido: item.apellidoRetirador || '',
        N_departamento: '',
        retiro_compartido: false
      } : undefined,
      notificacion: {
        ID_notificacion: 0,
        ID_pack: item.id,
        mensaje: item.descripcion || `Paquete entregado en ${item.ubicacion}`,
        fecha_envio: item.fechaEntrega || '',
        leido: false
      }
    };
  };

  // Función para manejar el retiro de paquetes
  const handleRetirePackage = (packageId: number) => {
    if (onRetirePackage) {
      onRetirePackage(packageId);
    }
  };

  // Función para manejar reclamos
  const handleComplaintPackage = (packageId: number) => {
    if (onComplaintPackage) {
      onComplaintPackage(packageId);
    }
  };
  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const total = items.length;
    const statusCounts = items.reduce((acc, item) => {
      const status = config.statusConfig.getStatus(item);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      pending: statusCounts.pending || 0,
      delivered: statusCounts.delivered || 0,
      expired: statusCounts.expired || 0,
      processing: statusCounts.processing || 0
    };
  }, [items, config.statusConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando datos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error: {error}</span>
        </div>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{config.title}</h1>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          {config.itemType === 'paquete' && showPackageDetails && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentViewMode('table')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentViewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Tabla
              </button>
              <button
                onClick={() => setCurrentViewMode('cards')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentViewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4 inline mr-1" />
                Tarjetas
              </button>
            </div>
          )}
          
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Última actualización: {formatDate(lastUpdate.toISOString())}
            </span>
          )}
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      {config.itemType === 'paquete' && showPackageDetails && currentViewMode === 'cards' ? (
        // Vista de tarjetas para paquetes
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay {config.itemType}s
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron {config.itemType}s para mostrar.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const packageData = convertToPackageData(item);
              const isPickedUp = !!item.fechaRetiro;
              
              return (
                <PackageDisplay
                  key={item.id}
                  packageData={packageData}
                  isPickedUp={isPickedUp}
                  onRetireClick={handleRetirePackage}
                  onComplaintClick={handleComplaintPackage}
                />
              );
            })
          )}
        </div>
      ) : (
        // Vista de tabla tradicional
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  {config.columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const status = config.statusConfig.getStatus(item);
                  const statusColor = config.statusConfig.getStatusColor(status);
                  const statusIcon = config.statusConfig.getStatusIcon(status);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {statusIcon}
                          <span className={`ml-2 text-sm font-medium ${statusColor}`}>
                            {status}
                          </span>
                        </div>
                      </td>
                      {config.columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.render 
                            ? column.render(item)
                            : item[column.key as keyof DashboardItem] || 'N/A'
                          }
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay {config.itemType}s
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No se encontraron {config.itemType}s para mostrar.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;