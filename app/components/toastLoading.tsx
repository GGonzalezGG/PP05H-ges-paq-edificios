import { toast } from 'react-toastify';

let loadingToastId: string | null = null;

export const showLoadingToast = (): void => {
  // Mostrar un toast con mensaje de "Cargando..."
  loadingToastId = toast.info('Cargando...', {
    autoClose: false,  // No se cierra automáticamente
    closeButton: false,  // No mostrar el botón de cierre
    hideProgressBar: true,  // No mostrar la barra de progreso
  });
};

export const hideLoadingToast = (): void => {
  // Si hay un toast cargando, lo cerramos
  if (loadingToastId) {
    toast.dismiss(loadingToastId);
    loadingToastId = null;
  }
};
