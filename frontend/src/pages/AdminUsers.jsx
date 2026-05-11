import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, X, Search } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showAlert, showConfirm, showToast } from '../utils/swal';
import PasswordInput from '../components/PasswordInput';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
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
      setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente' });
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
          <div>
            <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Nombre</label>
            <input 
              type="text" 
              className="input-field" 
              value={formData.name} 
              onChange={e => {
                const value = e.target.value.replace(/\s/g, '');
                setFormData({...formData, name: value});
              }} 
              required 
            />
          </div>
          <div>
            <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Email</label>
            <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
          </div>
          {!editingUser && (
            <div>
              <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Contraseña</label>
              <PasswordInput className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
            </div>
          )}
          <div>
            <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Rol</label>
            <select className="input-field" style={{ background: 'var(--background)' }} value={formData.tipoUsuario} onChange={e => setFormData({...formData, tipoUsuario: e.target.value})}>
              <option value="cliente">Cliente</option>
              <option value="administrador">Administrador</option>
            </select>
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
          setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente' });
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
                    <button className="btn-icon" onClick={() => openEdit(u)} style={{ marginRight: '10px', color: 'var(--primary)' }} title="Editar"><Edit2 size={18} /></button>
                    <button className="btn-icon" onClick={() => handleDelete(u.id)} style={{ color: 'var(--destructive)' }} title="Eliminar"><Trash2 size={18} /></button>
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
    </div>
  );
}
