export const STATUS_STYLES = {
  // Pedidos
  'Pendiente': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  'Pendiente de Validación': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  'En preparación': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' },
  'Cerrada': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
  'Cancelada': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  
  // Tickets
  'abierto': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
  'cerrado': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
  'resuelto': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },

  // Variantes (Normalización)
  'Cerrado': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
  'Cancelado': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' },
  'Entregado': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' }
};

export const getStatusStyle = (status) => {
  const normalizedStatus = status || 'Pendiente';
  return STATUS_STYLES[normalizedStatus] || { bg: 'rgba(100, 116, 139, 0.1)', text: '#64748b' };
};
