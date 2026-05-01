import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Package, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, User, MapPin } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showToast, showAlert, showConfirm } from '../utils/swal';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  // Debounce para búsqueda de usuario
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(userSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchOrders();
  }, [currentPage, navigate, statusFilter, sortBy, typeFilter, debouncedSearch]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/orders?page=${currentPage}&limit=8&status=${statusFilter}&sortBy=${sortBy}&type=${typeFilter}&user=${debouncedSearch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const confirm = await showConfirm(`¿Estás seguro?`, `¿Deseas marcar esta orden como ${status.toUpperCase()}?`, `Sí, ${status}`);
    if (!confirm.isConfirmed) return;
    try {
      await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders();
      showToast('Estado actualizado');
    } catch (err) {
      showAlert('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const viewDetails = async (order) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const details = res.data;
      
      const html = `
        <div style="text-align: left; font-size: 0.9rem;">
          <p><strong>Cliente:</strong> ${details.User?.name} (${details.User?.email})</p>
          <p><strong>Fecha:</strong> ${new Date(details.fecha_compra).toLocaleString()}</p>
          <p><strong>Estado:</strong> ${details.status}</p>
          <p><strong>Dirección:</strong> ${details.shipping_address || 'Retiro en local'}</p>
          <hr/>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #eee;">
                <th style="padding: 8px; text-align: left;">Producto</th>
                <th style="padding: 8px; text-align: center;">Cant.</th>
                <th style="padding: 8px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${details.OrderItems?.map(l => `
                <tr style="border-bottom: 1px solid #f9f9f9;">
                  <td style="padding: 8px;">${l.Product?.name || 'Producto'}</td>
                  <td style="padding: 8px; text-align: center;">${l.quantity}</td>
                  <td style="padding: 8px; text-align: right;">$${Number(l.priceAtPurchase * l.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="text-align: right; margin-top: 15px; font-size: 1.1rem; font-weight: 800; color: var(--primary);">
            TOTAL: $${Number(details.total).toLocaleString()}
          </div>
        </div>
      `;

      showAlert(`Orden #${order.id}`, html, 'info', { width: '600px' });
    } catch (err) {
      showAlert('Error', 'No se pudieron cargar los detalles', 'error');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Gestión de Compras</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Administra las ventas de los usuarios y actualiza sus estados.</p>
      </header>

      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <select className="input-field" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ width: '180px' }}>
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Cerrada">Cerrada</option>
          <option value="Cancelada">Cancelada</option>
        </select>

        <select className="input-field" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }} style={{ width: '180px' }}>
          <option value="">Todos los tipos</option>
          <option value="pedido">Pedidos (En envío)</option>
          <option value="compra">Compras (Finalizadas/Retiro)</option>
        </select>

        <select className="input-field" value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }} style={{ width: '180px' }}>
          <option value="date_desc">Más recientes</option>
          <option value="date_asc">Más antiguos</option>
          <option value="total_desc">Mayor total</option>
          <option value="total_asc">Menor total</option>
        </select>

        <input 
          type="text" 
          className="input-field" 
          placeholder="Buscar por usuario..." 
          value={userSearch} 
          onChange={e => { setUserSearch(e.target.value); setCurrentPage(1); }} 
          style={{ width: '250px' }} 
        />
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px' }}>Orden ID</th>
                <th style={{ padding: '16px' }}>Usuario</th>
                <th style={{ padding: '16px' }}>Total</th>
                <th style={{ padding: '16px' }}>Estado</th>
                <th style={{ padding: '16px' }}>Envío / Retiro</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay pedidos registrados.</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px', fontWeight: 700 }}>#{o.id}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <User size={14} color="var(--muted-foreground)" />
                        {o.User?.name || 'Usuario desconocido'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700 }}>${Number(o.total).toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                       <StatusBadge status={o.status} />
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px' }}><MapPin size={12}/> {o.shipping_address || 'Zeballos 1315 (Local)'}</div>
                        <div>{o.shipping_method || 'Presencial'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button className="btn btn-outline" onClick={() => viewDetails(o)} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                          Detalles
                        </button>
                        {o.status === 'Pendiente' && (
                          <>
                            <button className="btn btn-outline" onClick={() => updateStatus(o.id, 'Cerrada')} style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--success)', borderColor: 'var(--success)' }}>
                              Cerrar
                            </button>
                            <button className="btn btn-outline" onClick={() => updateStatus(o.id, 'Cancelada')} style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '15px', borderTop: '1px solid var(--border)' }}>
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{currentPage} / {totalPages}</span>
            <button className="pagination-btn" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'Pendiente': { bg: 'oklch(0.6 0.118 266.355 / 15%)', text: 'var(--primary)' },
    'Cerrada': { bg: 'oklch(0.627 0.194 149.214 / 15%)', text: 'var(--success)' },
    'Cancelada': { bg: 'oklch(0.637 0.237 25.331 / 15%)', text: 'var(--destructive)' }
  };
  const style = colors[status] || colors['Pendiente'];
  return (
    <span style={{ padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: style.bg, color: style.text }}>
      {status.toUpperCase()}
    </span>
  );
}
