import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export default function CancelPurchase() {
  const navigate = useNavigate();

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <XCircle size={80} color="var(--destructive)" style={{ marginBottom: '20px' }} />
      <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Compra Anulada</h2>
      <p style={{ color: 'var(--muted-foreground)', fontSize: '1.2rem', marginBottom: '30px', maxWidth: '600px' }}>
        Has cancelado el proceso de checkout de forma segura. No se ha realizado ningún cobro 
        en tus tarjetas ni cuentas asociadas.
      </p>

      <button className="btn" onClick={() => navigate('/cart')}>Volver a Mi Carrito</button>
    </div>
  );
}
