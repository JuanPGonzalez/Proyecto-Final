import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { showToast, showAlert } from '../utils/swal';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', direccion: '', sexo: '', fechaNac: '' });
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
          fechaNac: res.data.fechaNac ? res.data.fechaNac.split('T')[0] : ''
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
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Dirección de Envío</label>
                <input type="text" className="input-field" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
              </div>
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
                  <input type="date" className="input-field" value={formData.fechaNac} onChange={e => setFormData({...formData, fechaNac: e.target.value})} />
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
                      <span style={{ padding: '4px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'oklch(0.627 0.194 149.214 / 15%)', color: 'oklch(0.627 0.194 149.214)' }}>
                        {(order.status || 'pendiente').toUpperCase()}
                      </span>
                      <p style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '5px' }}>${Number(order.total || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {order.OrderItems?.map(item => (
                        <div key={item.id} style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', backgroundColor: 'var(--secondary)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
                          {item.Product?.name || 'Producto'} (x{item.quantity || 1})
                        </div>
                      ))}
                    </div>
                    <button 
                      className="btn btn-outline" 
                      style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                      onClick={async () => {
                        const token = localStorage.getItem('token');
                        try {
                          const res = await axios.get(`http://localhost:5000/api/orders/${order.id}/invoice`, {
                            headers: { Authorization: `Bearer ${token}` },
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `comprobante_${order.id}.pdf`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (err) {
                          showAlert('Error', 'No se pudo descargar el comprobante', 'error');
                        }
                      }}
                    >
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                       Ver Comprobante
                    </button>
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
