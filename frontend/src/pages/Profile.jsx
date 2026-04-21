import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', direccion: '', sexo: '', fechaNac: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    axios.get('http://localhost:5000/api/auth/profile', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUser(res.data);
        setFormData({
          name: res.data.name || '',
          direccion: res.data.direccion || '',
          sexo: res.data.sexo || '',
          fechaNac: res.data.fechaNac ? res.data.fechaNac.split('T')[0] : ''
        });
      })
      .catch((err) => {
        console.error(err);
        if(err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Perfil actualizado correctamente');
      localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
      alert('Error actualizando perfil');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (!user) return <div className="container" style={{paddingTop:'40px'}}>Cargando...</div>;

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Mi Perfil ({user.tipoUsuario})</h2>
        <button className="btn btn-outline" onClick={logout} style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>Cerrar Sesión</button>
      </div>
      
      <div className="card" style={{ padding: '30px', maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="input-label">Nombre</label>
            <input type="text" className="input-field" style={{width: '100%'}} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
          </div>
          <div>
            <label className="input-label">Dirección</label>
            <input type="text" className="input-field" style={{width: '100%'}} value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
          </div>
          <div>
            <label className="input-label">Sexo</label>
            <select className="input-field" style={{width: '100%', background:'var(--background)'}} value={formData.sexo} onChange={e => setFormData({...formData, sexo: e.target.value})}>
              <option value="Indefinido">Prefiero no decirlo</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
            </select>
          </div>
          <div>
            <label className="input-label">Fecha de Nacimiento</label>
            <input type="date" className="input-field" style={{width: '100%'}} value={formData.fechaNac} onChange={e => setFormData({...formData, fechaNac: e.target.value})} />
          </div>
          <button type="submit" className="btn">Guardar Cambios</button>
        </form>
      </div>
    </div>
  );
}
