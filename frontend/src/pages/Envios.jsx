import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Envios() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleEnvio = async (metodo) => {
    localStorage.setItem('shipping_method', metodo);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Debes iniciar sesión para finalizar la compra real.');
      return navigate('/login');
    }
    
    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/orders', { cartItems: cart, shippingMethod: metodo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate('/success');
    } catch (e) {
      alert('Error en checkout: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Opciones de Entrega</h2>
      <p style={{ color: 'var(--ml-light-text)', marginBottom: '40px' }}>Por favor escoge cómo deseas recibir tu pedido en tu domicilio.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div className="card" style={{ padding: '30px', cursor: 'pointer', border: '2px solid transparent' }} onClick={() => handleEnvio('Estandar')}>
          <h3>Envío Estándar</h3>
          <h2 style={{ color: '#00a650', margin: '15px 0' }}>Gratis</h2>
          <p style={{ color: 'var(--ml-light-text)' }}>Llega entre 3 a 5 días hábiles.</p>
        </div>

        <div className="card" style={{ padding: '30px', cursor: 'pointer', border: '2px solid transparent' }} onClick={() => handleEnvio('Express')}>
          <h3>Envío Express</h3>
          <h2 style={{ color: '#00a650', margin: '15px 0' }}>$1,500</h2>
          <p style={{ color: 'var(--ml-light-text)' }}>Recíbelo en menos de 24 horas.</p>
        </div>

        <div className="card" style={{ padding: '30px', cursor: 'pointer', border: '2px solid transparent' }} onClick={() => handleEnvio('Tienda')}>
          <h3>Retiro en Tienda</h3>
          <h2 style={{ color: '#00a650', margin: '15px 0' }}>Gratis</h2>
          <p style={{ color: 'var(--ml-light-text)' }}>Retíralo hoy mismo en nuestra sucursal técnica.</p>
        </div>

      </div>
      
      <button style={{ background: 'none', border: 'none', color: '#d9534f', marginTop: '40px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/cancel-purchase')}>
        Cancelar Todo
      </button>
    </div>
  );
}
