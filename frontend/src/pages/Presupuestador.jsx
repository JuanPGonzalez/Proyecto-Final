import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Presupuestador() {
  const [products, setProducts] = useState([]);
  const [budget, setBudget] = useState({ CPU: null, GPU: null, RAM: null, MOBO: null });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(console.error);
  }, []);

  const total = Object.values(budget).reduce((acc, p) => acc + (p ? Number(p.price) : 0), 0);

  const agregarAlCarrito = () => {
    const items = Object.values(budget).filter(p => p !== null);
    if(items.length === 0) return alert('No hay piezas seleccionadas');
    
    // Add multiple items safely
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(...items);
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('¡Build armada agregada exitosamente al carrito general!');
    navigate('/cart');
  };

  const OptionSelect = ({ category, label }) => {
    // Si tu bd tiene 'categoria', usamos eso. Si no, simularemos usando keywords en description/name
    const filteredList = products.filter(p => 
      p.category === category || 
      p.description?.toLowerCase().includes(category.toLowerCase()) ||
      p.name?.toLowerCase().includes(category.toLowerCase())
    );

    return (
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ marginBottom: '5px' }}>{label}</h4>
        <select 
          className="input-field" 
          style={{ width: '100%', backgroundColor: 'var(--background)' }}
          onChange={(e) => {
            const item = products.find(p => p.id === parseInt(e.target.value));
            setBudget(prev => ({ ...prev, [category]: item || null }));
          }}
        >
          <option value="">Selecciona tu {label}</option>
          {filteredList.map(p => (
            <option key={p.id} value={p.id}>{p.name} - ${Number(p.price).toLocaleString()}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>Armador de PCs Personalizado</h2>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '30px' }}>Selecciona pieza por pieza para cotizar tu armado ideal. El sistema cuidará la compatibilidad.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        <div className="card" style={{ padding: '30px' }}>
          <OptionSelect category="CPU" label="Procesador (CPU)" />
          <OptionSelect category="GPU" label="Placa de Video (GPU)" />
          <OptionSelect category="RAM" label="Memoria RAM" />
          <OptionSelect category="MOBO" label="Placa Madre (Motherboard)" />
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '20px' }}>
            *Para el propósito del demo universitario, la lista es general y extraída del stock.
          </p>
        </div>

        <div className="card" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
          <h3>Resumen de Build</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px', minHeight: '150px' }}>
            {Object.entries(budget).map(([key, item]) => (
              <li key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                <span style={{ color: item ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{item ? item.name : `Sin ${key}`}</span>
                <span>{item ? `$${Number(item.price).toLocaleString()}` : '$0'}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '20px' }}>
             <strong>Total Inversión:</strong>
             <h3 style={{ color: 'var(--primary)' }}>${total.toLocaleString()}</h3>
          </div>

          <button className="btn" style={{ width: '100%' }} onClick={agregarAlCarrito}>Añadir al Carrito</button>
        </div>
      </div>
    </div>
  );
}
