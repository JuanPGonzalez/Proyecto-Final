import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { showAlert } from '../utils/swal';
import PasswordInput from '../components/PasswordInput';

export default function Login({ initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { identifier: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, password: formData.password };
      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      const user = {
        ...res.data.user,
        tipoUsuario: res.data.user.tipoUsuario || res.data.user.tipo_usuario,
        tipo_usuario: res.data.user.tipo_usuario || res.data.user.tipoUsuario
      };
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(user));
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
              placeholder="Nombre de usuario (sin espacios)" 
              className="input-field" 
              required
              value={formData.name}
              onChange={e => {
                const value = e.target.value.replace(/\s/g, '');
                setFormData({ ...formData, name: value });
              }}
            />
          )}
          <input 
            type={isLogin ? "text" : "email"}
            placeholder={isLogin ? "Email o usuario" : "Correo electrónico"}
            className="input-field" 
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <PasswordInput 
            placeholder="Contraseña" 
            className="input-field" 
            required
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />
          {isLogin && (
            <div style={{ textAlign: 'right', marginTop: '-5px' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          )}
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
