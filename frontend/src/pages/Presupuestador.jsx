import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../utils';
import { Cpu, Monitor, Zap, Layout, HardDrive, Plug } from 'lucide-react';
import { showAlert } from '../utils/swal';

export default function Presupuestador() {
  const [products, setProducts] = useState([]);
  const [budget, setBudget] = useState({ CPU: null, MOBO: null, RAM: null, GPU: null, Almacenamiento: null, Fuente: null });
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(console.error);
  }, []);

  const total = Object.values(budget).reduce((acc, p) => acc + (p ? Number(p.price) : 0), 0);

  // --- MOTOR DE COMPATIBILIDAD V2: WATTAGE CALCULATOR ---
  const calculateWattage = () => {
    let totalW = 50; // Base system power draw (Motherboard, RAM, Fans, SSD)
    if (budget.CPU) {
      const n = budget.CPU.name.toLowerCase();
      if (n.includes('i9') || n.includes('7950x')) totalW += 253;
      else if (n.includes('i7') || n.includes('7800x') || n.includes('5800x')) totalW += 160;
      else if (n.includes('i5') || n.includes('7600') || n.includes('5600')) totalW += 105;
      else totalW += 65;
    }
    if (budget.GPU) {
      const n = budget.GPU.name.toLowerCase();
      if (n.includes('4090') || n.includes('7900 xtx')) totalW += 450;
      else if (n.includes('4080') || n.includes('7900 xt')) totalW += 320;
      else if (n.includes('4070') || n.includes('7800 xt')) totalW += 250;
      else if (n.includes('4060') || n.includes('7600')) totalW += 115;
      else totalW += 200;
    }
    return totalW;
  };

  const estimatedWatts = calculateWattage();
  const safeWattage = estimatedWatts + 150; // Minimum 150W Safety Headroom

  const agregarAlCarrito = () => {
    const items = Object.values(budget).filter(p => p !== null);
    if(items.length === 0) return showAlert('Presupuesto vacío', 'Por favor selecciona al menos un componente.', 'info');
    
    const sinStock = items.filter(p => Number(p.stock) <= 0);
    if (sinStock.length > 0) {
      return showAlert(
        'Sin Stock',
        `Los siguientes productos no tienen stock disponible: ${sinStock.map(p => p.name).join(', ')}. Por favor selecciona otra opción.`,
        'warning'
      );
    }

    setIsAdding(true);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    items.forEach(product => {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.quantity < product.stock) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                showAlert('Stock máximo', `Ya tienes el máximo disponible de ${product.name}.`, 'warning');
            }
        } else {
            cart.push({ ...product, quantity: 1 });
        }
    });

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    
    setTimeout(() => {
      navigate('/cart');
    }, 500);
  };

  const OptionSelect = ({ category, categoryName, label, icon, filter, warningMsg }) => {
    let filteredList = products.filter(p => p.Category?.descripcion === categoryName && Number(p.stock) > 0);
    
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
          style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-md)', opacity: filteredList.length === 0 ? 0.5 : 1 }}
          value={budget[category]?.id || ""}
          disabled={filteredList.length === 0}
          onChange={(e) => {
            const item = products.find(p => p.id === parseInt(e.target.value));
            setBudget(prev => {
              const newBudget = { ...prev, [category]: item || null };
              // Reset dependent fields if parent changes
              if (category === 'CPU') {
                newBudget.MOBO = null;
                newBudget.RAM = null;
                newBudget.Fuente = null; // Reset PSU because wattage changed
              } else if (category === 'MOBO') {
                newBudget.RAM = null;
              } else if (category === 'GPU') {
                newBudget.Fuente = null; // Reset PSU because wattage changed
              }
              return newBudget;
            });
          }}
        >
          <option value="">{filteredList.length === 0 ? warningMsg || 'Selecciona opciones previas requeridas...' : 'Selecciona una opción...'}</option>
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

  const limpiarPresupuesto = () => {
    setBudget({ CPU: null, MOBO: null, RAM: null, GPU: null, Almacenamiento: null, Fuente: null });
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px', paddingBottom: '80px' }}>
      <header style={{ marginBottom: '50px', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '15px' }}>Configurador de PC Expert</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>
            Armá tu setup ideal. Nuestro **Motor Algorítmico de Compatibilidad** filtra automáticamente 
            cuellos de botella energéticos y desajustes de socket.
          </p>
        </div>
        <button 
          className="btn btn-outline" 
          onClick={limpiarPresupuesto}
          style={{ marginBottom: '5px', padding: '10px 20px', fontSize: '0.9rem', color: 'var(--destructive)', borderColor: 'var(--destructive)' }}
        >
          Limpiar Selección
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '50px', alignItems: 'start' }}>
        
        <div className="card" style={{ padding: '40px' }}>
          <OptionSelect 
            category="CPU" 
            categoryName="Procesadores" 
            label="Procesador" 
            icon={<Cpu size={18} />} 
          />
          
          <OptionSelect 
            category="MOBO" 
            categoryName="Motherboards" 
            label="Motherboard" 
            icon={<Layout size={18} />} 
            warningMsg="Primero debes seleccionar un CPU"
            filter={(p) => !budget.CPU || p.socket === budget.CPU.socket}
          />
          
          <OptionSelect 
            category="RAM" 
            categoryName="Memorias RAM" 
            label="Memoria RAM" 
            icon={<Zap size={18} />} 
            warningMsg="Primero debes seleccionar una Motherboard"
            filter={(p) => !budget.MOBO || (budget.MOBO.memoryType && budget.MOBO.memoryType.includes(p.memoryType))}
          />
          
          <OptionSelect 
            category="GPU" 
            categoryName="Tarjetas Gráficas" 
            label="Placa de Video" 
            icon={<Monitor size={18} />} 
          />

          <OptionSelect 
            category="Almacenamiento" 
            categoryName="Semiconductor" 
            label="Almacenamiento (SSD/HDD)" 
            icon={<HardDrive size={18} />} 
            filter={(p) => p.name.toLowerCase().includes('ssd') || p.name.toLowerCase().includes('hdd')}
          />

          <OptionSelect 
            category="Fuente" 
            categoryName="Gabinetes" 
            label="Fuente de Poder (PSU)" 
            icon={<Plug size={18} />} 
            warningMsg="Primero debes elegir un Procesador y una Placa de Video"
            filter={(p) => {
               if (!budget.CPU || !budget.GPU) return false;
               const wMatch = p.name.match(/(\d+)\s*w/i) || p.description?.match(/(\d+)\s*w/i);
               const psuWatts = wMatch ? parseInt(wMatch[1]) : 0;
               // Filter PSUs that have at least the Safe Wattage (Estimated + 150W Margin)
               return psuWatts >= safeWattage;
            }}
          />

          <div style={{ padding: '20px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)', marginTop: '20px' }}>
             <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', textAlign: 'center' }}>
               ¿Necesitas ayuda adicional? Consultá con nuestro <strong>Asistente IA</strong> en la esquina inferior.
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

          <div style={{ padding: '15px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Consumo Estimado:</span>
             <span style={{ fontSize: '1.1rem', fontWeight: 800, color: (budget.CPU || budget.GPU) ? 'var(--accent)' : 'var(--muted-foreground)' }}>
               {estimatedWatts}W
             </span>
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
