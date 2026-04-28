import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CreditCard, Wallet, Banknote, ShieldCheck, ChevronRight } from 'lucide-react';
import { getStorageItem } from '../utils/storage';

export default function Payment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const cart = getStorageItem('cart', []);
  const shippingInfo = getStorageItem('last_shipping', { cost: 0, address: '' });
  
  const subtotal = cart.reduce((acc, p) => acc + (Number(p.price) * (p.quantity || 1)), 0);
  const total = subtotal + shippingInfo.cost;

  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
  }, [cart, navigate]);

  const handleFinalize = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      // Estructura para el backend (Order + OrderItems)
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity || 1,
          priceAtPurchase: item.price
        })),
        shippingAddress: shippingInfo.method === 'tienda' ? null : shippingInfo.address,
        localidad: shippingInfo.method === 'tienda' ? null : shippingInfo.localidad,
        codigoPostal: shippingInfo.method === 'tienda' ? null : shippingInfo.codigoPostal,
        shippingMethod: shippingInfo.method
      };

      await axios.post('http://localhost:5000/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.setItem('last_payment_method', method);
      navigate('/success');
    } catch (err) {
      alert('Error al procesar el pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
        
        {/* Lado Izquierdo: Selección de Método */}
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Método de Pago</h2>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '30px' }}>Selecciona cómo deseas abonar tu compra.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PaymentOption 
              id="card" 
              title="Tarjeta de Crédito / Débito" 
              icon={<CreditCard size={24} />} 
              selected={method === 'card'} 
              onClick={() => setMethod('card')}
              desc="Visa, Mastercard, American Express"
            />
            <PaymentOption 
              id="cash" 
              title="Efectivo en el Local" 
              icon={<Banknote size={24} />} 
              selected={method === 'cash'} 
              onClick={() => setMethod('cash')}
              desc="Abona al retirar en Zeballos 1315"
            />
          </div>

          {method === 'card' && (
            <div className="card animate-slide-up" style={{ marginTop: '30px', padding: '30px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input className="input-field" placeholder="Número de tarjeta" />
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px' }}>
                    <input className="input-field" placeholder="Nombre en tarjeta" />
                    <input className="input-field" placeholder="CVV" maxLength="4" />
                  </div>
               </div>
            </div>
          )}

          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
             <ShieldCheck size={20} color="var(--success)" />
             Tus datos están protegidos con encriptación de grado bancario.
          </div>
        </div>

        {/* Lado Derecho: Resumen */}
        <div className="card" style={{ padding: '30px', height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '20px' }}>Resumen de Compra</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Subtotal ({cart.length} ítems)</span>
                <span>${subtotal.toLocaleString()}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Costo de Envío</span>
                <span style={{ color: shippingInfo.cost === 0 ? 'var(--success)' : 'inherit' }}>
                  {shippingInfo.cost === 0 ? 'Gratis' : `$${shippingInfo.cost.toLocaleString()}`}
                </span>
             </div>
             <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
             </div>
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            onClick={handleFinalize}
            disabled={loading}
          >
            {loading ? 'Procesando...' : (
              <>Confirmar Pago <ChevronRight size={18} /></>
            )}
          </button>
          
          <button 
            onClick={() => navigate('/envio')}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted-foreground)', marginTop: '15px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Volver a envío
          </button>
        </div>

      </div>
    </div>
  );
}

function PaymentOption({ title, icon, selected, onClick, desc }) {
  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{ 
        padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer',
        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ color: selected ? 'var(--accent)' : 'var(--muted-foreground)' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{desc}</div>
      </div>
      <div style={{ 
        width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        backgroundColor: selected ? 'var(--accent)' : 'transparent'
      }}>
        {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
      </div>
    </div>
  );
}
