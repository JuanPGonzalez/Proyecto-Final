import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Settings, Database, Headphones, Cpu, HelpCircle, Sun, Moon, AlertCircle, Package } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { getStorageItem, setStorageItem } from '../utils/storage';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  
  const user = getStorageItem('user', {});
  const isAdmin = isAdminRole(user);
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');

  // Aplicar tema
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Limpiar busqueda al cambiar de pagina
  useEffect(() => {
    if (location.pathname !== '/') {
      setSearchTerm('');
    }
  }, [location.pathname]);

  // Search as you type with debounce
  useEffect(() => {
    // Si no estamos en el home, abortamos cualquier busqueda automatica
    if (location.pathname !== '/') return;

    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      } else if (searchTerm === '' && location.pathname === '/') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('search')) {
           navigate('/');
        }
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, navigate, location.pathname]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if(searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/');
    }
  };

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
      <header style={{ backgroundColor: 'var(--card)', padding: '15px 0', position: 'sticky', top: 0, zIndex: 50, borderBottom:'1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div className="container flex items-center justify-between">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ color: 'var(--foreground)', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing:'-0.5px' }}>
              Hardware Haven<span style={{color: 'var(--accent)'}}>.</span>
            </h1>
          </Link>
          
          <form onSubmit={handleSearch} style={{ flex: 1, margin: '0 40px', position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Buscar productos, marcas y más..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingRight: '40px', borderRadius: 'var(--radius-lg)' }}
            />
            <button type="submit" style={{ position: 'absolute', right: '15px', top: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
               <Search size={18} color="var(--muted-foreground)" />
            </button>
          </form>

          <div className="flex items-center gap-5">
            {isAdmin && (
              <div style={{ display: 'flex', gap: '15px', marginRight: '10px', borderRight: '1px solid var(--border)', paddingRight: '15px' }}>
                <Link to="/admin" title="BI Dashboard" style={{ color:'var(--muted-foreground)' }}><Settings size={20} /></Link>
                <Link to="/admin/productos" title="Inventario" style={{ color:'var(--muted-foreground)' }}><Database size={20} /></Link>
                <Link to="/admin/reclamos" title="Reclamos" style={{ color:'var(--muted-foreground)' }}><AlertCircle size={20} /></Link>
                <Link to="/admin/pedidos" title="Pedidos" style={{ color:'var(--muted-foreground)' }}><Package size={20} /></Link>
              </div>
            )}

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%' }}
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <Link to={token ? '/profile' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--foreground)' }}>
              <User size={20} color="var(--foreground)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{token ? (user?.name?.split(' ')[0] || 'Usuario') : 'Ingresar'}</span>
            </Link>

            {!isAdmin && (
              <Link to="/cart" title="Mi Carrito" style={{ color:'var(--foreground)', position: 'relative', marginLeft: '10px' }}>
                <ShoppingCart size={22} />
                {cartCount > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-10px', background: 'var(--accent)', color: 'var(--accent-foreground)', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Riel secundario corporativo */}
      <nav style={{ backgroundColor: 'var(--background)', padding: '12px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
         <div className="container flex gap-6" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/presupuestador" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
              <Cpu size={16} color="var(--accent)"/> Armá tu PC
            </Link>
            
            {!isAdmin && (
              <Link to="/soporte" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
                <Headphones size={16} color="var(--accent)"/> Soporte / Reclamos
              </Link>
            )}

            <Link to="/ayuda" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
              <HelpCircle size={16} color="var(--accent)"/> Centro de Ayuda
            </Link>
         </div>
      </nav>
    </>
  );
}
