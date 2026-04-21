import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login({ initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await axios.post(`http://localhost:5000${endpoint}`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Error de autenticación');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
      <div className="card" style={{ padding: '40px', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Nombre completo" 
              className="input-field" 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          )}
          <input 
            type="email" 
            placeholder="Correo electrónico" 
            className="input-field" 
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            className="input-field" 
            required
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit" className="btn" style={{ marginTop: '10px' }}>
            {isLogin ? 'Ingresar' : 'Registrarse'}
          </button>
        </form>
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}
