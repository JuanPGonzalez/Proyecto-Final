import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { showAlert } from '../utils/swal';
import PasswordInput from '../components/PasswordInput';

export default function Login({ initialMode = 'login' }) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', 
    dni: '', direccion: '', fechaNac: '', sexo: 'Indefinido' 
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { identifier: formData.email, password: formData.password }
        : { ...formData };
        
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
    <div className="container animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', marginBottom: '50px' }}>
      <div className="card" style={{ padding: '40px', width: '100%', maxWidth: isLogin ? '400px' : '550px', transition: 'max-width 0.3s ease' }}>
        <h2 style={{ marginBottom: '20px', textAlign: 'center', fontWeight: 'bold' }}>
          {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta Personal'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* LOGIN VIEW */}
          {isLogin && (
            <>
              <input 
                type="text"
                placeholder="Email o usuario"
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
              <div style={{ textAlign: 'right', marginTop: '-5px' }}>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </>
          )}

          {/* REGISTER VIEW */}
          {!isLogin && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                <input 
                  type="email"
                  placeholder="Correo electrónico"
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
                <input 
                  type="number"
                  placeholder="DNI"
                  className="input-field" 
                  required
                  value={formData.dni}
                  onChange={e => setFormData({ ...formData, dni: e.target.value })}
                />
                <input 
                  type="text"
                  placeholder="Dirección de Envío"
                  className="input-field" 
                  required
                  value={formData.direccion}
                  onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                  style={{ gridColumn: 'span 2' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Fecha de Nacimiento</label>
                  <input 
                    type="date"
                    className="input-field" 
                    required
                    value={formData.fechaNac}
                    onChange={e => setFormData({ ...formData, fechaNac: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Sexo</label>
                  <select 
                    className="input-field" 
                    required
                    value={formData.sexo}
                    onChange={e => setFormData({ ...formData, sexo: e.target.value })}
                  >
                    <option value="Indefinido">Prefiero no decirlo</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn" style={{ marginTop: '10px' }}>
            {isLogin ? 'Ingresar' : 'Registrarse completando mis datos'}
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
