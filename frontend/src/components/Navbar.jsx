import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Settings, Database, Headphones, Cpu } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [cartCount, setCartCount] = useState(0);

  // Escuchar cambios en el carrito en todo momento vía ventana local
  useEffect(() => {
    const updateCartCount = () => {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(items.length);
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    // Intervalo simple de polling local para detectar inserts propios
    const interval = setInterval(updateCartCount, 1000); 
    return () => { window.removeEventListener('storage', updateCartCount); clearInterval(interval); };
  }, []);

  return (
    <>
      <header style={{ backgroundColor: 'var(--primary)', padding: '15px 0', position: 'sticky', top: 0, zIndex: 50, borderBottom:'1px solid var(--accent)' }}>
        <div className="container flex items-center justify-between">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ color: 'var(--primary-foreground)', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing:'-0.5px' }}>
              Hardware<span style={{color: 'var(--accent)'}}>Haven</span>
            </h1>
          </Link>
          
          <div style={{ flex: 1, margin: '0 40px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Buscar componentes..."
              style={{ width: '100%', padding: '10px 15px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none' }}
            />
            <Search size={18} color="var(--muted-foreground)" style={{ position: 'absolute', right: '15px', top: '11px', cursor: 'pointer' }} />
          </div>

          <div className="flex items-center gap-5">
            {user.tipoUsuario === 'admin' && (
              <div style={{ display: 'flex', gap: '15px', marginRight: '10px', borderRight: '1px solid rgba(255,255,255,0.2)', paddingRight: '15px' }}>
                <Link to="/admin" title="BI Dashboard" style={{ color:'var(--primary-foreground)' }}><Settings size={20} /></Link>
                <Link to="/admin/productos" title="Inventario" style={{ color:'var(--primary-foreground)' }}><Database size={20} /></Link>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--primary-foreground)' }} onClick={() => navigate(token ? '/profile' : '/login')}>
              <User size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{token ? user.name.split(' ')[0] : 'Ingresar'}</span>
            </div>

            <Link to="/cart" title="Mi Carrito" style={{ color:'var(--primary-foreground)', position: 'relative' }}>
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: 'var(--accent)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Riel secundario corporativo */}
      <nav style={{ backgroundColor: 'var(--background)', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
         <div className="container flex gap-6">
            <Link to="/presupuestador" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
              <Cpu size={16} color="var(--accent)"/> Armá tu PC
            </Link>
            <Link to="/soporte" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
              <Headphones size={16} color="var(--accent)"/> Soporte / Reclamos
            </Link>
            <Link to="/ayuda" style={{ color:'var(--foreground)', fontWeight:500 }}>Centro de Ayuda</Link>
         </div>
      </nav>
    </>
  );
}
