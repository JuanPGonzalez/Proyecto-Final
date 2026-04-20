import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function CompraExitosa() {
  const navigate = useNavigate();

  useEffect(() => {
    // Vaciar carrito al finalizar con éxito
    localStorage.removeItem('cart');
  }, []);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <CheckCircle size={80} color="#00a650" style={{ marginBottom: '20px' }} />
      <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>¡Compra Confirmada!</h2>
      <p style={{ color: 'var(--ml-light-text)', fontSize: '1.2rem', marginBottom: '30px' }}>
        Tu paquete ya fue emitido al sector de logística y empaquetado. Recibirás tu recibo fiscal vía correo electrónico.
      </p>
      
      <div className="card" style={{ padding: '30px', width: '100%', maxWidth: '500px', backgroundColor: '#f9f9f9', marginBottom: '30px' }}>
        <h3 style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>ID de Transacción: #{Math.floor(Math.random() * 1000000)}</h3>
        <p style={{ marginTop: '20px' }}>Método de envío seleccionado: <strong>{localStorage.getItem('shipping_method') || 'Estándar'}</strong></p>
      </div>

      <button className="btn" onClick={() => navigate('/')}>Seguir Comprando</button>
    </div>
  );
}
