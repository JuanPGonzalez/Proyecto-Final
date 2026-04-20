import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ShieldAlert size={80} color="#d9534f" style={{ marginBottom: '20px' }} />
      <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>403 Acceso Denegado</h2>
      <p style={{ color: 'var(--ml-light-text)', fontSize: '1.2rem', marginBottom: '30px', maxWidth: '600px' }}>
        No tienes permisos suficientes para visualizar esta página. Debes iniciar sesión con una cuenta 
        de nivel Administrador para ingresar a los recursos del sistema.
      </p>

      <button className="btn" onClick={() => navigate('/login')}>Ir al Login</button>
    </div>
  );
}
