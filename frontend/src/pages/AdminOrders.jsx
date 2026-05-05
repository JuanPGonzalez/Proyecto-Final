import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, User, MapPin, Download, CreditCard, Landmark, Banknote, FileText, Play, FileDown, Loader2, ExternalLink } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showToast, showAlert, showConfirm } from '../utils/swal';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) return navigate('/forbidden');
    fetchOrders();
  }, [currentPage, statusFilter, sortBy]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: currentPage, limit: 8, status: statusFilter, sortBy }
      });
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      default: return method || "Desconocido";
    }
  };

  const handlePrepare = async (id) => {
    const confirm = await showConfirm('¿Iniciar preparación?', 'Esto marcará la orden como "En preparación".', 'Sí, preparar');
    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/prepare`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Orden en preparación');
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo iniciar la preparación';
      showAlert('Error', msg, 'error');
    }
  };

  const handleClose = async (id) => {
    const confirm = await showConfirm('¿Cerrar pedido?', '¿Deseas marcar la orden como CERRADA? Se descontará el stock.', 'Sí, cerrar');
    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/close`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Pedido cerrado con éxito');
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo cerrar el pedido';
      showAlert('Error', msg, 'error');
    }
  };

  const handleCancel = async (id) => {
    const confirm = await showConfirm('¿Cancelar compra?', 'Esta acción no se puede deshacer.', 'Sí, cancelar');
    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Compra cancelada');
      fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo cancelar la compra';
      showAlert('Error', msg, 'error');
    }
  };

  const handleGeneratePickingPdf = async () => {
    setGeneratingPdf(true);
    try {
      const response = await fetch('http://localhost:5000/api/orders/preparing/pdf', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 404) {
        return showAlert('Sin pedidos', 'No hay órdenes en estado "En preparación" para generar el picking.', 'info');
      }

      if (!response.ok) throw new Error('Error al generar PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `picking_preparacion_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Picking generado correctamente');
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo generar el picking de preparación', 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const viewDetails = async (order) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = res.data;
      
      const receiptSection = d.payment_method === 'transfer' ? `
        <div style="margin-top: 15px; padding: 12px; border-radius: 8px; background-color: var(--secondary); border: 1px dashed var(--border);">
           <p style="margin-bottom: 8px; font-weight: 700; color: var(--primary);">Comprobante de pago:</p>
           ${d.payment_receipt ? `
             <a href="http://localhost:5000/${d.payment_receipt}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; color: #10b981; font-weight: 800; text-decoration: none;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Ver comprobante
             </a>
           ` : `
             <p style="color: #f59e0b; font-weight: 600; font-size: 0.85rem;">Comprobante no disponible</p>
           `}
        </div>
      ` : '';

      const html = `
        <div style="text-align: left; font-size: 0.95rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <p><strong>Cliente:</strong><br/> ${d.User?.name}</p>
            <p><strong>Email:</strong><br/> ${d.User?.email}</p>
            <p><strong>Método Pago:</strong><br/> ${getPaymentMethodLabel(d.payment_method)}</p>
            <p><strong>Dirección:</strong><br/> ${d.shipping_address || 'Retiro en local'}</p>
          </div>
          
          ${receiptSection}

          <hr style="margin: 20px 0; border-top: 1px solid var(--border);"/>
          <h4 style="margin-bottom: 10px;">Productos</h4>
          <div style="margin: 10px 0; max-height: 200px; overflow-y: auto;">
            ${d.OrderItems?.map(i => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem;">
                <span>${i.quantity}x ${i.Product?.name || 'Producto'}</span>
                <span style="font-weight: 600;">$${Number(i.priceAtPurchase * i.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div style="text-align: right; font-weight: 900; font-size: 1.2rem; color: var(--primary); border-top: 2px solid var(--border); padding-top: 10px; margin-top: 10px;">
            TOTAL: $${Number(d.total).toLocaleString()}
          </div>
        </div>
      `;
      showAlert(`Orden #${order.id}`, html, 'info', { width: '550px' });
    } catch (e) { showAlert('Error', 'No se pudo cargar detalles', 'error'); }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Gestión de Compras</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>Administra las órdenes y genera las listas de preparación.</p>
        </div>
        
        <button 
          className="btn btn-outline" 
          disabled={generatingPdf}
          onClick={handleGeneratePickingPdf}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '45px', borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          {generatingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
          Generar PDF de Preparación
        </button>
      </header>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '220px' }}>
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendientes (Efectivo/Tarjeta)</option>
          <option value="Pendiente de Validación">Por Validar (Transferencia)</option>
          <option value="En preparación">En preparación</option>
          <option value="Cerrada">Cerradas</option>
          <option value="Cancelada">Canceladas</option>
        </select>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th style={{ padding: '16px' }}>Orden ID</th>
              <th style={{ padding: '16px' }}>Pago / Comprobante</th>
              <th style={{ padding: '16px' }}>Estado Actual</th>
              <th style={{ padding: '16px', textAlign: 'center' }}>Acción Requerida</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px', fontWeight: 700 }}>#{o.id}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {o.payment_method === 'transfer' ? <Landmark size={16} color="#10b981" /> : (o.payment_method === 'card' ? <CreditCard size={16} color="#3b82f6" /> : <Banknote size={16} color="#f59e0b" />)}
                    <span style={{ fontSize: '0.85rem' }}>{getPaymentMethodLabel(o.payment_method)}</span>
                    {o.payment_method === 'transfer' && o.payment_receipt && (
                      <a href={`http://localhost:5000/${o.payment_receipt}`} target="_blank" rel="noopener noreferrer" title="Ver Comprobante">
                        <FileText size={18} color="#10b981" style={{ cursor: 'pointer' }} />
                      </a>
                    )}
                  </div>
                </td>
                <td style={{ padding: '16px' }}>
                  <StatusBadge status={o.status} />
                </td>
                <td style={{ padding: '16px', textAlign: 'center' }}>
                   <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      
                      {o.status === 'Pendiente de Validación' && (
                        <button className="btn" onClick={() => handlePrepare(o.id)} style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <CheckCircle size={14} /> Validar y Preparar
                        </button>
                      )}

                      {o.status === 'Pendiente' && (
                        <button className="btn" onClick={() => handlePrepare(o.id)} style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Play size={14} /> Iniciar Preparación
                        </button>
                      )}

                      {o.status === 'En preparación' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn" onClick={() => handleClose(o.id)} style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#3b82f6' }}>
                            Cerrar Pedido
                          </button>
                        </div>
                      )}

                      {o.status !== 'Cerrada' && o.status !== 'Cancelada' && (
                        <button className="btn btn-outline" onClick={() => handleCancel(o.id)} style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                          Cancelar
                        </button>
                      )}

                      <button className="btn btn-outline" onClick={() => viewDetails(o)} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                        Info
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{currentPage} / {totalPages}</span>
            <button className="pagination-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronRight size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'Pendiente': { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' },
    'Pendiente de Validación': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' },
    'En preparación': { bg: 'rgba(139, 92, 246, 0.1)', text: '#8b5cf6' },
    'Cerrada': { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    'Cancelada': { bg: 'rgba(239, 68, 68, 0.1)', text: '#ef4444' }
  };
  const s = styles[status] || styles['Pendiente'];
  return (
    <span style={{ padding: '4px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 800, backgroundColor: s.bg, color: s.text }}>
      {status.toUpperCase()}
    </span>
  );
}
