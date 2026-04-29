import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showAlert, showConfirm, showToast } from '../utils/swal';

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

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Gestión de Usuarios</h2>
        <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
          setEditingUser(null);
          setFormData({ name: '', email: '', password: '', tipoUsuario: 'cliente' });
          setShowModal(true);
        }}>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
              <th style={{ padding: '15px', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Nombre</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Rol</th>
              <th style={{ padding: '15px', fontWeight: 600 }}>Registro</th>
              <th style={{ padding: '15px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '15px' }}>{u.id}</td>
                <td style={{ padding: '15px', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '15px', color: 'var(--muted-foreground)' }}>{u.email}</td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '0.8rem', 
                    fontWeight: 600,
                    backgroundColor: u.tipoUsuario === 'admin' ? 'oklch(0.6 0.2 250 / 20%)' : 'oklch(0.6 0.2 150 / 20%)',
                    color: u.tipoUsuario === 'admin' ? 'oklch(0.6 0.2 250)' : 'oklch(0.6 0.2 150)'
                  }}>
                    {u.tipo_usuario || u.tipoUsuario}
                  </span>
                </td>
                <td style={{ padding: '15px', color: 'var(--muted-foreground)' }}>{new Date(u.fecha_reg || u.fechaReg).toLocaleDateString()}</td>
                <td style={{ padding: '15px', textAlign: 'right' }}>
                  <button className="btn-icon" onClick={() => openEdit(u)} style={{ marginRight: '10px', color: 'var(--primary)' }}><Edit2 size={18} /></button>
                  <button className="btn-icon" onClick={() => handleDelete(u.id)} style={{ color: 'var(--destructive)' }}><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay usuarios registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '30px', position: 'relative' }}>
            <button className="btn-icon" style={{ position: 'absolute', top: '20px', right: '20px' }} onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
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
                  <input type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
              )}
              <div>
                <label className="input-field" style={{ border: 'none', padding: 0, fontWeight: 600, display: 'block', marginBottom: '5px' }}>Rol</label>
                <select className="input-field" style={{ background: 'var(--background)' }} value={formData.tipoUsuario} onChange={e => setFormData({...formData, tipoUsuario: e.target.value})}>
                  <option value="cliente">Cliente</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" className="btn" style={{ marginTop: '10px' }}>{editingUser ? 'Actualizar' : 'Crear Usuario'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
