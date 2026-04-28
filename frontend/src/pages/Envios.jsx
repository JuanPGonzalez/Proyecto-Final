import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Truck, Store, Calculator, ChevronRight } from 'lucide-react';
import { getStorageItem, setStorageItem } from '../utils/storage';

export default function Envios() {
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [method, setMethod] = useState('standard');
  const [cost, setCost] = useState(0);
  const cart = getStorageItem('cart', []);

  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
    const user = getStorageItem('user', {});
    if (user.direccion) setAddress(user.direccion);
  }, [cart, navigate]);

  const calculateCost = () => {
    if (method === 'tienda') return 0;
    if (method === 'express') return 5000;
    return 3000;
  };

  useEffect(() => {
    setCost(calculateCost());
  }, [address, method]);

  const handleContinue = () => {
    if (method !== 'tienda') {
      if (!address || !localidad || !codigoPostal) {
        return alert('Por favor ingresa todos los datos de envío (dirección, localidad, código postal).');
      }
    }
    
    setStorageItem('last_shipping', {
      address,
      localidad,
      codigoPostal,
      method,
      cost
    });
    navigate('/pago');
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px', textAlign: 'center' }}>Configuración de Envío</h2>
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '40px', textAlign: 'center' }}>Calculamos el costo basado en la distancia desde Zeballos 1315, Rosario.</p>
        
        {method !== 'tienda' && (
          <div className="card" style={{ padding: '30px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Dirección de Entrega</label>
              <div style={{ position: 'relative' }}>
                 <MapPin size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'var(--muted-foreground)' }} />
                 <input 
                   type="text" 
                   className="input-field" 
                   placeholder="Ej: Av. Pellegrini 1500, Rosario" 
                   style={{ paddingLeft: '45px' }}
                   value={address}
                   onChange={e => setAddress(e.target.value)}
                 />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Localidad</label>
                <input type="text" className="input-field" placeholder="Ej: Rosario" value={localidad} onChange={e => setLocalidad(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '8px', display: 'block' }}>Código Postal</label>
                <input type="text" className="input-field" placeholder="Ej: 2000" value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <ShipOption 
            id="standard" 
            title="Envío Estándar" 
            desc="3-5 días hábiles" 
            icon={<Truck size={24} />} 
            selected={method === 'standard'} 
            onClick={() => setMethod('standard')} 
          />
          <ShipOption 
            id="express" 
            title="Envío Express" 
            desc="Llega en 24hs" 
            icon={<Truck size={24} color="var(--accent)" />} 
            selected={method === 'express'} 
            onClick={() => setMethod('express')} 
          />
          <ShipOption 
            id="tienda" 
            title="Retiro en Tienda" 
            desc="Zeballos 1315, Rosario" 
            icon={<Store size={24} />} 
            selected={method === 'tienda'} 
            onClick={() => setMethod('tienda')} 
          />
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <Calculator size={20} color="var(--primary)" />
              <div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Costo estimado de envío</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: cost === 0 ? 'var(--success)' : 'var(--foreground)' }}>
                  {cost === 0 ? '¡Gratis!' : `$${cost.toLocaleString()}`}
                </div>
              </div>
           </div>
           <button className="btn" style={{ padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleContinue}>
             Continuar al Pago <ChevronRight size={18} />
           </button>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button onClick={() => navigate('/cart')} style={{ background: 'none', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}>Volver al carrito</button>
        </div>
      </div>
    </div>
  );
}

function ShipOption({ title, desc, icon, selected, onClick }) {
  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{ 
        padding: '24px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
        backgroundColor: selected ? 'oklch(0.627 0.194 259.215 / 5%)' : 'var(--card)'
      }}
    >
      <div style={{ marginBottom: '15px', color: selected ? 'var(--accent)' : 'var(--foreground)' }}>{icon}</div>
      <h3 style={{ fontSize: '1rem', marginBottom: '5px' }}>{title}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{desc}</p>
    </div>
  );
}
