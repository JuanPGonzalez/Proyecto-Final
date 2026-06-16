import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, X, Search, ShoppingBag, Calendar, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showAlert, showConfirm, showToast } from '../utils/swal';
import PasswordInput from '../components/PasswordInput';
import { getStatusStyle } from '../constants/statusStyles';
import OrderDetailModal from '../components/OrderDetailModal';

// ──────────────────────────────────────────────────────────────
// Sub-componente: Modal de historial de compras de un usuario
// ──────────────────────────────────────────────────────────────
function UserOrderHistoryModal({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalOverflow; };
  }, []);

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrders = async (p = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
        params: { clientId: user.id, page: p, limit: 8 }
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalSpent = orders.reduce((acc, o) => acc + Number(o.total || 0), 0);

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 10001, backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        className="card animate-fade-in"
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(860px, 96vw)', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0, boxShadow: '0 30px 70px rgba(0,0,0,0.5)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              Historial de Compras — <span style={{ color: 'var(--primary)' }}>{user.name}</span>
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--muted-foreground)' }}>{user.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted-foreground)' }}>Cargando compras...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '16px', display: 'block', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', fontWeight: 600 }}>Este usuario no tiene compras registradas.</p>
            </div>
          ) : (
            <>
              {/* Resumen rápido */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px 20px', backgroundColor: 'rgba(59,130,246,0.06)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.15)' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>Total de Órdenes</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>{orders.length}</span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.15)' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>Total Gastado</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>${totalSpent.toLocaleString('es-AR')}</span>
                </div>
                <div style={{ padding: '16px 20px', backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: '10px', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '4px' }}>Prom. por Orden</span>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900 }}>${orders.length ? Math.round(totalSpent / orders.length).toLocaleString('es-AR') : 0}</span>
                </div>
              </div>

              {/* Tabla de órdenes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {orders.map(o => (
                  <div
                    key={o.id}
                    onClick={() => setSelectedOrder(o.id)}
                    style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr auto auto', gap: '16px', alignItems: 'center', padding: '14px 18px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.18s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px -5px rgba(0,0,0,0.12)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--primary)' }}>#{o.id}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>
                      <Calendar size={13} />
                      {o.fecha_compra ? new Date(o.fecha_compra).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem' }}>
                      <DollarSign size={14} style={{ color: '#10b981' }} />
                      {Number(o.total).toLocaleString('es-AR')}
                    </div>
                    <span style={{
                      padding: '5px 12px', borderRadius: '50px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
                      backgroundColor: getStatusStyle(o.status).bg,
                      color: getStatusStyle(o.status).text
                    }}>{o.status}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>Ver →</span>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
                  <button className="btn btn-outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ height: '34px', padding: '0 12px' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Pág. {page} de {totalPages}</span>
                  <button className="btn btn-outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ height: '34px', padding: '0 12px' }}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sub-modal de detalle de orden */}
      {selectedOrder && (
        <OrderDetailModal orderId={selectedOrder} onClose={() => setSelectedOrder(null)} zIndex={10002} />
      )}
    </div>,
    document.body
  );
}

// ──────────────────────────────────────────────────────────────
// Página principal AdminUsers
// ──────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userHistoryModal, setUserHistoryModal] = useState(null); // usuario seleccionado para ver compras
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tipoUsuario: 'cliente'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const navigate = useNavigate();

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/forbidden');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (!isAdminRole(user)) {
        navigate('/forbidden');
        return;
      }
    } else {
      navigate('/login');
      return;
    }
    fetchUsers();
  }, [navigate]);

  // Combined Filtering Logic
  const filteredUsers = users.filter(u => {
    const role = (u.tipoUsuario || u.tipo_usuario || '').toLowerCase();
    const roleMatch = roleFilter === 'all' || role === roleFilter;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = u.name.toLowerCase().includes(searchLower);
    const idMatch = String(u.id).includes(searchTerm);
    const emailMatch = u.email.toLowerCase().includes(searchLower);
    
    return roleMatch && (nameMatch || idMatch || emailMatch);
  });

  // Body scroll lock
  useEffect(() => {
    if (showModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          tipoUsuario: formData.tipoUsuario
        }, { headers: { Authorization: `Bearer ${token}` } });
        showToast('Usuario actualizado');
      } else {
        await axios.post('http://localhost:5000/api/admin/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Usuario creado');
      }
      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente', sexo: 'Indefinido', fechaNac: '', direccion: 'Desconocida', dni: '', fechaReg: '' });
      fetchUsers();
    } catch (error) {
      showAlert('Error', error.response?.data?.error || 'Error al guardar usuario', 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirm = await showConfirm('¿Eliminar usuario?', 'Esta acción no se puede deshacer.', 'Eliminar');
    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('token');
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Usuario eliminado');
      fetchUsers();
    } catch (error) {
      showAlert('Error', 'Error al eliminar usuario', 'error');
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // No editar password desde aca de manera simple por seguridad
      tipoUsuario: user.tipo_usuario || user.tipoUsuario
    });
    setShowModal(true);
  };

  if (loading) return <div className="container" style={{paddingTop: '60px'}}>Cargando usuarios...</div>;

  const modalRoot = (
    <div 
      className="modal-portal-overlay"
      onClick={() => setShowModal(false)}
      style={{
        position: 'fixed', 
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', 
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="card animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{ 
          width: 'min(600px, 95vw)', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          padding: '40px', 
          position: 'relative',
          backgroundColor: 'var(--card)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <button className="btn-icon" style={{ position: 'absolute', top: '20px', right: '20px' }} onClick={() => setShowModal(false)}>
          <X size={20} />
        </button>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', fontWeight: 800 }}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Nombre</label>
              <input type="text" className="input-field" value={formData.name} onChange={e => { const value = e.target.value; setFormData({...formData, name: value}); }} required />
            </div>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Email</label>
              <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>DNI</label>
              <input type="number" className="input-field" value={formData.dni} onChange={e => setFormData({...formData, dni: e.target.value})} />
            </div>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Sexo</label>
              <select className="input-field" style={{ background: 'var(--background)' }} value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Indefinido">Indefinido</option>
              </select>
            </div>

            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Fecha de Nacimiento</label>
              <input type="date" className="input-field" value={formData.fechaNac} onChange={e => setFormData({...formData, fechaNac: e.target.value})} />
            </div>
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Fecha de Registro</label>
              <input type="date" className="input-field" value={formData.fechaReg} onChange={e => setFormData({...formData, fechaReg: e.target.value})} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Dirección</label>
              <input type="text" className="input-field" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
            </div>

            {!editingUser && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Contraseña</label>
                <PasswordInput className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              </div>
            )}
            
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Rol</label>
              <select className="input-field" style={{ background: 'var(--background)' }} value={formData.tipoUsuario} onChange={e => setFormData({...formData, tipoUsuario: e.target.value})}>
                <option value="cliente">Cliente</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn" style={{ marginTop: '10px', height: '45px', fontWeight: 700 }}>{editingUser ? 'Actualizar' : 'Crear Usuario'}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Gestión de Usuarios</h2>
        <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
          setEditingUser(null);
          setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente', sexo: 'Indefinido', fechaNac: '', direccion: 'Desconocida', dni: '', fechaReg: '' });
          setShowModal(true);
        }}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
           <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
           <input 
             type="text" 
             className="input-field" 
             placeholder="Buscar por nombre, email o ID..." 
             style={{ paddingLeft: '40px' }}
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <select 
          className="input-field" 
          style={{ width: '200px' }}
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="all">Todos los roles</option>
          <option value="administrador">Administradores</option>
          <option value="cliente">Clientes</option>
        </select>
        {(searchTerm || roleFilter !== 'all') && (
          <button className="btn btn-outline" onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}>Limpiar</button>
        )}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <th style={{ padding: '15px', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Nombre</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Rol</th>
              <th style={{ padding: '15px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              const role = (u.tipoUsuario || u.tipo_usuario || '').toLowerCase();
              const isAdmin = role === 'administrador' || role === 'admin';
              const isClient = !isAdmin;
              
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '15px' }}>{u.id}</td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>{u.name}</td>
                  <td style={{ padding: '15px', color: 'var(--muted-foreground)' }}>{u.email}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      backgroundColor: isAdmin ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isAdmin ? '#8b5cf6' : '#10b981',
                      border: `1px solid ${isAdmin ? 'rgba(139, 92, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                    }}>
                      {isAdmin ? 'Administrador' : 'Cliente'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {/* Botón Ver Compras — solo para clientes */}
                      {isClient && (
                        <button
                          className="btn btn-outline"
                          onClick={() => setUserHistoryModal(u)}
                          title="Ver historial de compras"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '6px 12px', height: '32px', fontWeight: 700, color: 'var(--primary)', borderColor: 'var(--primary)' }}
                        >
                          <ShoppingBag size={14} /> Compras
                        </button>
                      )}
                      <button className="btn-icon" onClick={() => openEdit(u)} style={{ color: 'var(--primary)' }} title="Editar"><Edit2 size={18} /></button>
                      <button className="btn-icon" onClick={() => handleDelete(u.id)} style={{ color: 'var(--destructive)' }} title="Eliminar"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '50px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay usuarios que coincidan con los filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(modalRoot, document.body)}
      {userHistoryModal && <UserOrderHistoryModal user={userHistoryModal} onClose={() => setUserHistoryModal(null)} />}
    </div>
  );
}
