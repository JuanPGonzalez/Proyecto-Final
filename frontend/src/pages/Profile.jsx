import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';
import { ChevronLeft, ChevronRight, Eye, FileText, ExternalLink, MapPin } from 'lucide-react';
import { showToast, showAlert, showConfirm } from '../utils/swal';
import { getStatusStyle } from '../constants/statusStyles';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', direccion: '', sexo: '', fechaNac: '', dni: '' });
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    const headers = { Authorization: `Bearer ${token}` };

    axios.get('http://localhost:5000/api/auth/profile', { headers })
      .then(res => {
        setUser(res.data);
        setFormData({
          name: res.data.name || '',
          direccion: res.data.direccion || '',
          sexo: res.data.sexo || '',
          fechaNac: res.data.fechaNac ? res.data.fechaNac.split('T')[0] : '',
          dni: res.data.dni || ''
        });

        if (!isAdminRole(res.data)) {
          axios.get(`http://localhost:5000/api/orders?page=${currentPage}&limit=5`, { headers })
            .then(orderRes => {
              setOrders(orderRes.data.orders);
              setTotalPages(orderRes.data.totalPages);
            })
            .catch(console.error);
        }
      })
      .catch((err) => {
        console.error(err);
        if(err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }, [navigate, currentPage]);

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "card": return "Tarjeta";
      case "transfer": return "Transferencia";
      default: return method || "Desconocido";
    }
  };

  const viewSummary = (order) => {
    const receiptSection = order.payment_method === 'transfer' ? `
      <div style="margin-top: 15px; padding: 12px; border-radius: 8px; background-color: var(--secondary); border: 1px dashed var(--border);">
         <p style="margin-bottom: 8px; font-weight: 700; color: var(--primary);">Comprobante de pago:</p>
         ${order.payment_receipt ? `
           <a href="http://localhost:5000/${order.payment_receipt}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; color: #10b981; font-weight: 800; text-decoration: none;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Ver comprobante subido
           </a>
         ` : `
           <p style="color: #f59e0b; font-weight: 600; font-size: 0.85rem;">Subida de comprobante pendiente</p>
         `}
      </div>
    ` : '';

    const html = `
      <div style="text-align: left; font-size: 0.95rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <p><strong>Fecha:</strong><br/> ${new Date(order.fecha_compra || order.createdAt).toLocaleDateString()}</p>
          <p>
            <strong>Estado:</strong><br/> 
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 800; background-color: ${getStatusStyle(order.status).bg}; color: ${getStatusStyle(order.status).text};">
              ${(order.status || 'PENDIENTE').toUpperCase()}
            </span>
          </p>
          <p><strong>Método Pago:</strong><br/> ${getPaymentMethodLabel(order.payment_method)}</p>
          <p><strong>Envío:</strong><br/> ${order.shipping_method || 'Estándar'}</p>
          <p style="grid-column: span 2;"><strong>Dirección:</strong><br/> ${order.shipping_address || 'Retiro en local'}</p>
        </div>
        
        ${receiptSection}

        <hr style="margin: 20px 0; border-top: 1px solid var(--border);"/>
        <h4 style="margin-bottom: 10px;">Productos</h4>
        <div style="margin: 10px 0; max-height: 200px; overflow-y: auto;">
          ${order.OrderItems?.map(i => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 0.85rem;">
              <span>${i.quantity}x ${i.Product?.name || 'Producto'}</span>
              <span style="font-weight: 600;">$${Number(i.priceAtPurchase * i.quantity).toLocaleString('es-AR')}</span>
            </div>
          `).join('')}
        </div>
        <div style="text-align: right; font-weight: 900; font-size: 1.2rem; color: var(--primary); border-top: 2px solid var(--border); padding-top: 10px; margin-top: 10px;">
          TOTAL: $${Number(order.total).toLocaleString('es-AR')}
        </div>
      </div>
    `;
    showAlert(`Resumen Orden #${order.id}`, html, 'info', { width: '550px' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Perfil actualizado');
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      showAlert('Error', 'No se pudo actualizar el perfil', 'error');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };


  if (!user) return <div className="container" style={{paddingTop:'40px'}}>Cargando...</div>;

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '50px' }}>
        
        {/* Lado Izquierdo: Datos de Perfil */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Mi Perfil</h2>
            <button className="btn btn-outline" onClick={logout} style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)', padding: '8px 16px', fontSize: '0.85rem' }}>Salir</button>
          </div>
          
          <div className="card" style={{ padding: '30px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Nombre</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>DNI / Documento (Solo números)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="Ej: 12345678"
                  value={formData.dni} 
                  onChange={e => setFormData({...formData, dni: e.target.value})} 
                />
              </div>
              {!isAdminRole(user) && (
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Dirección Guardada (Opcional)</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted-foreground)' }} />
                    <input 
                      type="text" 
                      className="input-field" 
                      style={{ paddingLeft: '40px' }}
                      placeholder="Para usar como predeterminada en el checkout"
                      value={formData.direccion === 'Desconocida' ? '' : formData.direccion} 
                      onChange={e => setFormData({...formData, direccion: e.target.value})} 
                    />
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Género</label>
                  <select className="input-field" style={{ background:'var(--background)' }} value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                    <option value="Indefinido">Prefiero no decir</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Nacimiento</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.fechaNac} 
                    onChange={e => setFormData({...formData, fechaNac: e.target.value})} 
                    onBlur={() => {
                       if (!formData.fechaNac && user.fechaNac) {
                          setFormData(prev => ({ ...prev, fechaNac: user.fechaNac.split('T')[0] }));
                       }
                    }}
                  />
                </div>
              </div>
              <button type="submit" className="btn" style={{ marginTop: '10px' }}>Actualizar Perfil</button>
            </form>
          </div>
        </div>

        {isAdminRole(user) && (
          <div className="card" style={{ padding: '30px', marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px' }}>Panel de Administración</h3>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '20px' }}>Accede a las herramientas de gestión del negocio.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button className="btn" style={{ padding:'12px' }} onClick={() => navigate('/admin')}>📊 BI Dashboard</button>
              <button className="btn btn-outline" style={{ padding:'12px' }} onClick={() => navigate('/admin/productos')}>📦 Inventario</button>
              <button className="btn btn-outline" style={{ padding:'12px' }} onClick={() => navigate('/admin/pedidos')}>📝 Pedidos</button>
              <button className="btn btn-outline" style={{ padding:'12px' }} onClick={() => navigate('/admin/reclamos')}>🎧 Reclamos</button>
              <button className="btn btn-outline" style={{ padding:'12px' }} onClick={() => navigate('/admin/usuarios')}>👥 Usuarios</button>
            </div>
          </div>
        )}

        {/* Lado Derecho: Historial de Órdenes */}
        {!isAdminRole(user) ? (
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '30px' }}>Historial de Órdenes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.length === 0 ? (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                  Aún no has realizado ninguna compra.
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Orden #{order.id}</span>
                      <p style={{ fontWeight: 600 }}>{new Date(order.fecha_compra || order.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '50px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700, 
                        backgroundColor: getStatusStyle(order.status).bg, 
                        color: getStatusStyle(order.status).text 
                      }}>
                        {(order.status || 'pendiente').toUpperCase()}
                      </span>
                      <p style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '5px' }}>${Number(order.total || 0).toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {order.OrderItems?.map(item => (
                          <div key={item.id} style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', backgroundColor: 'var(--secondary)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            {item.Product?.name || 'Producto'} <span style={{ fontWeight: 800, color: 'var(--foreground)', marginLeft: '4px' }}>x{item.quantity || 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0, marginLeft: 'auto' }}>
                      <button 
                        className="btn btn-outline" 
                        style={{ fontSize: '0.75rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary)', fontWeight: 700 }}
                        onClick={() => viewSummary(order)}
                      >
                         <Eye size={14} />
                         Ver Resumen
                      </button>

                      {order.payment_method === 'transfer' && order.payment_receipt && (
                        <a 
                          href={`http://localhost:5000/${order.payment_receipt}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-outline"
                          style={{ fontSize: '0.75rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', borderColor: '#10b981', textDecoration: 'none', fontWeight: 700 }}
                        >
                          <ExternalLink size={14} />
                          Comprobante
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                ))
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{currentPage} / {totalPages}</span>
                  <button className="pagination-btn" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}
