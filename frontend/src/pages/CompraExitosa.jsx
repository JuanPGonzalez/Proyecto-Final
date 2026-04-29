import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Mail, Package, MapPin, CreditCard } from 'lucide-react';

export default function CompraExitosa() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Read order from state or localStorage fallback
  const order = location.state || JSON.parse(localStorage.getItem('lastOrder') || 'null');
  
  const [orderId] = useState(Math.floor(Math.random() * 90000) + 10000);

  useEffect(() => {
    // Limpiar carrito después de renderizar el resumen
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('storage'));
  }, []);

  if (!order || !order.items) {
    return (
      <div className="container" style={{ marginTop: '100px', textAlign: 'center' }}>
        <h2>Error: No se encontraron datos del pedido.</h2>
        <button className="btn" onClick={() => navigate('/')} style={{ marginTop: '20px' }}>Volver al Inicio</button>
      </div>
    );
  }

  const { items, shipping, total, paymentMethod } = order;

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px', maxWidth: '700px' }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center', border: '1px solid var(--success)', backgroundColor: 'oklch(0.627 0.194 149.214 / 5%)' }}>
        <CheckCircle size={60} color="var(--success)" style={{ marginBottom: '20px' }} />
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>¡Pedido Confirmado!</h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>Gracias por confiar en Hardware Haven. Tu orden #{orderId} está en proceso.</p>
        
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'left' }}>
           <h3 style={{ fontSize: '1rem', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Resumen de Operación</h3>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <MapPin size={16} color="var(--muted-foreground)" />
                 <span><strong>Envío:</strong> {shipping.method === 'tienda' ? 'Retiro en Zeballos 1315' : `${shipping.address}, ${shipping.localidad || ''} ${shipping.codigoPostal || ''}`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <CreditCard size={16} color="var(--muted-foreground)" />
                 <span><strong>Pago:</strong> {paymentMethod.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Package size={16} color="var(--muted-foreground)" />
                 <span><strong>Productos:</strong> {items.length} artículos</span>
              </div>
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
                 <span>Total Abonado</span>
                 <span style={{ color: 'var(--accent)' }}>${total.toLocaleString()}</span>
              </div>
           </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', color: 'var(--success)', fontWeight: 600 }}>
           <Mail size={20} />
           <span>Se ha enviado el comprobante a tu correo electrónico.</span>
        </div>

        <button className="btn" style={{ marginTop: '40px', padding: '12px 40px' }} onClick={() => navigate('/')}>
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}
