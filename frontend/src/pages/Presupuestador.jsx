import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../utils';
import { Cpu, Monitor, Zap, Layout } from 'lucide-react';

export default function Presupuestador() {
  const [products, setProducts] = useState([]);
  const [budget, setBudget] = useState({ CPU: null, GPU: null, RAM: null, MOBO: null });
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(console.error);
  }, []);

  const total = Object.values(budget).reduce((acc, p) => acc + (p ? Number(p.price) : 0), 0);

  const agregarAlCarrito = () => {
    const items = Object.values(budget).filter(p => p !== null);
    if(items.length === 0) return alert('Por favor selecciona al menos un componente.');
    
    setIsAdding(true);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(...items);
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Trigger navbar update
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      navigate('/cart');
    }, 500);
  };

  const OptionSelect = ({ category, categoryId, label, icon, filter }) => {
    let filteredList = products.filter(p => p.categoria_id === categoryId);
    
    if (filter) {
      filteredList = filteredList.filter(filter);
    }

    return (
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ color: 'var(--primary)' }}>{icon}</span>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</h4>
        </div>
        <select 
          className="input-field" 
          style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)' }}
          value={budget[category]?.id || ""}
          onChange={(e) => {
            const item = products.find(p => p.id === parseInt(e.target.value));
            setBudget(prev => {
              const newBudget = { ...prev, [category]: item || null };
              // Reset dependent fields if parent changes
              if (category === 'CPU') {
                newBudget.MOBO = null;
                newBudget.RAM = null;
              } else if (category === 'MOBO') {
                newBudget.RAM = null;
              }
              return newBudget;
            });
          }}
        >
          <option value="">Selecciona una opción...</option>
          {filteredList.map(p => (
            <option key={p.id} value={p.id}>{p.name} — {formatCurrency(p.price)}</option>
          ))}
        </select>
        {budget[category] && (
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '5px', fontWeight: 500 }}>
             {budget[category].socket ? `Socket: ${budget[category].socket}` : ''}
             {budget[category].memoryType ? ` | Memoria: ${budget[category].memoryType}` : ''}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px', paddingBottom: '80px' }}>
      <header style={{ marginBottom: '50px', maxWidth: '700px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '15px' }}>Configurador de PC Expert</h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>
          Armá tu setup ideal con componentes seleccionados por rendimiento. 
          Hardware Haven garantiza la compatibilidad de las piezas listadas.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '50px', alignItems: 'start' }}>
        
        <div className="card" style={{ padding: '40px' }}>
          <OptionSelect 
            category="CPU" 
            categoryId={1} 
            label="Procesador" 
            icon={<Cpu size={18} />} 
          />
          
          <OptionSelect 
            category="MOBO" 
            categoryId={3} 
            label="Motherboard" 
            icon={<Layout size={18} />} 
            filter={(p) => !budget.CPU || p.socket === budget.CPU.socket}
          />
          
          <OptionSelect 
            category="RAM" 
            categoryId={2} 
            label="Memoria RAM" 
            icon={<Zap size={18} />} 
            filter={(p) => !budget.MOBO || p.memoryType === budget.MOBO.memoryType}
          />
          
          <OptionSelect 
            category="GPU" 
            categoryId={4} 
            label="Placa de Video" 
            icon={<Monitor size={18} />} 
          />
          <div style={{ padding: '20px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', marginTop: '20px' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>
               ¿Necesitas ayuda? Consultá con nuestro <strong>Asistente IA</strong> en la esquina inferior.
             </p>
          </div>
        </div>

        <div className="card" style={{ padding: '40px', position: 'sticky', top: '120px', border: '1px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '30px' }}>Resumen Técnico</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
            {Object.entries(budget).map(([key, item]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{key}</p>
                  <p style={{ fontSize: '0.95rem', fontWeight: 500, color: item ? 'var(--foreground)' : 'oklch(0.5 0 0 / 30%)' }}>
                    {item ? item.name : 'Pendiente'}
                  </p>
                </div>
                <span style={{ fontWeight: 600 }}>{item ? formatCurrency(item.price) : '-'}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '25px', marginBottom: '30px' }}>
             <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Presupuesto Total</span>
             <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(total)}</span>
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', padding: '18px', fontSize: '1rem' }} 
            onClick={agregarAlCarrito}
            disabled={isAdding}
          >
            {isAdding ? 'Agregando...' : 'Agregar Build Completa'}
          </button>
        </div>
      </div>
    </div>
  );
}
