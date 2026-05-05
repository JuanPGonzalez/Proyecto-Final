import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Settings, Database, Headphones, Cpu, HelpCircle, Sun, Moon, AlertCircle, Package, Bell, X, Check, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';
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

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = React.useRef(null);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    
    setShowNotifications(false);

    if (isAdmin) {
      if (notif.type === 'ORDER') {
        navigate('/admin/pedidos');
      } else if (notif.type === 'TICKET') {
        navigate('/admin/reclamos');
      }
    } else {
      if (notif.type === 'ORDER') {
        navigate('/profile');
      } else if (notif.type === 'TICKET') {
        navigate('/soporte');
      }
    }
  };

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

  // Escuchar cambios en el carrito
  useEffect(() => {
    const updateCartCount = () => {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(items.length);
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
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
                <Link to="/admin/stock" title="Gestión de Stock" style={{ color:'var(--muted-foreground)' }}><FileSpreadsheet size={20} /></Link>
                <Link to="/admin/reclamos" title="Reclamos" style={{ color:'var(--muted-foreground)' }}><AlertCircle size={20} /></Link>
                <Link to="/admin/pedidos" title="Pedidos" style={{ color:'var(--muted-foreground)' }}><Package size={20} /></Link>
              </div>
            )}

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', padding: '8px', borderRadius: '50%' }}
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Sun size={20} />}
            </button>

            <Link to={token ? '/profile' : '/login'} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: 'var(--foreground)' }}>
              <User size={20} color="var(--foreground)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{token ? (user?.name?.split(' ')[0] || 'Usuario') : 'Ingresar'}</span>
            </Link>

            {token && (
              <div ref={notificationRef} style={{ position: 'relative', marginLeft: '15px' }}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--foreground)', display: 'flex', alignItems: 'center', position: 'relative' }}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--destructive)', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="card animate-fade-in" style={{ position: 'absolute', top: '40px', right: '-50px', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 100, padding: '0', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'var(--card)', zIndex: 2 }}>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>Notificaciones</h4>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> Marcar todo
                        </button>
                      )}
                    </div>
                    <div style={{ padding: '0' }}>
                      {notifications.length === 0 ? (
                        <p style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '0.9rem', margin: 0 }}>No tienes notificaciones.</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)} 
                            style={{ 
                              padding: '15px', 
                              borderBottom: '1px solid var(--border)', 
                              backgroundColor: n.is_read ? 'transparent' : 'var(--secondary)', 
                              cursor: 'pointer', 
                              transition: 'background 0.2s' 
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>{n.type}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{new Date(n.created_at).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: n.is_read ? 'var(--muted-foreground)' : 'var(--foreground)', lineHeight: 1.4 }}>{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

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
            {!isAdmin && (
              <Link to="/presupuestador" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
                <Cpu size={16} color="var(--accent)"/> Armá tu PC
              </Link>
            )}
            
            {!isAdmin && (
              <Link to="/soporte" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
                <Headphones size={16} color="var(--accent)"/> Soporte / Reclamos
              </Link>
            )}

            {!isAdmin && (
              <Link to="/ayuda" style={{ display: 'flex', alignItems:'center', gap:'5px', color:'var(--foreground)', fontWeight:500 }}>
                <HelpCircle size={16} color="var(--accent)"/> Centro de Ayuda
              </Link>
            )}
         </div>
      </nav>
    </>
  );
}
