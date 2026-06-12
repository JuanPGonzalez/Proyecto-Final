import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, CreditCard, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';
import { showToast, showAlert, showConfirm } from '../utils/swal';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (isAdminRole(user)) {
      navigate('/forbidden');
      return;
    }

    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(items);
  }, [navigate]);

  const removeFromCart = (index) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('storage')); // Notificar al Navbar
  };

  const updateQuantity = (idx, newQuantity) => {
    const newItems = [...cartItems];
    if (newQuantity < 1) return;
    if (newQuantity > newItems[idx].stock) {
      showAlert('Stock máximo alcanzado', 'No hay más unidades disponibles de este producto.', 'warning');
      return;
    }
    newItems[idx].quantity = newQuantity;
    setCartItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
    window.dispatchEvent(new Event('storage'));
  };

  const total = cartItems.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);

  const checkout = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showAlert('Acceso Restringido', 'Debes iniciar sesión para finalizar la compra.', 'info');
      return navigate('/login');
    }

    // Validar stock en tiempo real antes de proceder
    try {
      const res = await axios.get('http://localhost:5000/api/products');
      const currentProducts = res.data;
      const outOfStockItems = [];
      let updatedCart = [...cartItems];
      let cartModified = false;

      updatedCart.forEach((item, idx) => {
        const current = currentProducts.find(p => p.id === item.id);
        if (!current || Number(current.stock) <= 0) {
          outOfStockItems.push({ name: item.name, requested: item.quantity || 1, available: 0 });
          updatedCart[idx] = null; // marcar para eliminar
          cartModified = true;
        } else if (Number(current.stock) < (item.quantity || 1)) {
          outOfStockItems.push({ name: item.name, requested: item.quantity || 1, available: Number(current.stock) });
          updatedCart[idx] = { ...item, quantity: Number(current.stock) };
          cartModified = true;
        }
      });

      if (outOfStockItems.length > 0) {
        // Limpiar items sin stock y actualizar cantidades
        updatedCart = updatedCart.filter(item => item !== null);
        setCartItems(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        window.dispatchEvent(new Event('storage'));

        const detailHtml = outOfStockItems.map(i =>
          `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee;">
            <span style="font-weight:600;text-align:left;">${i.name}</span>
            <span style="color:${i.available === 0 ? '#ef4444' : '#f59e0b'};">${i.available === 0 ? 'Sin stock' : `Stock: ${i.available} (pedido: ${i.requested})`}</span>
          </div>`
        ).join('');

        showAlert(
          'Stock Insuficiente',
          `<p style="margin-bottom:15px;">Algunos productos no tienen stock suficiente. El carrito fue ajustado:</p>${detailHtml}`,
          'warning'
        );
        return;
      }

      navigate('/envio');
    } catch (err) {
      console.error('Error validando stock:', err);
      // Si falla la validación, proceder igualmente (el backend validará)
      navigate('/envio');
    }
  };

  const vaciarCarrito = async () => {
    const confirm = await showConfirm('¿Vaciar el carrito?', 'Se eliminarán todos los productos seleccionados.', 'Sí, vaciar');
    if (!confirm.isConfirmed) return;
    
    setCartItems([]);
    localStorage.removeItem('cart');
    window.dispatchEvent(new Event('storage'));
    showToast('Carrito vaciado');
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '60px', maxWidth: '1000px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ backgroundColor: 'var(--secondary)', padding: '12px', borderRadius: '50%' }}>
             <ShoppingBag size={24} />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px' }}>Tu Carrito</h2>
        </div>
        
        {cartItems.length > 0 && (
          <button 
            onClick={vaciarCarrito}
            style={{ 
              background: 'none', border: 'none', color: 'var(--destructive)', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', 
              gap: '8px', fontWeight: 600, fontSize: '0.9rem' 
            }}
          >
            <Trash2 size={18} /> Vaciar Carrito
          </button>
        )}
      </header>
      
      {cartItems.length === 0 ? (
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center', backgroundColor: 'var(--card)' }}>
          <ShoppingBag size={48} style={{ marginBottom: '20px', opacity: 0.2 }} />
          <h3 style={{ color: 'var(--muted-foreground)', fontWeight: 500 }}>Tu carrito está vacío</h3>
          <button className="btn" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
            Explorar Productos
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '40px', alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {cartItems.map((item, idx) => (
              <div key={idx} className="card animate-fade-in" style={{ display: 'flex', padding: '24px', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '100px', height: '100px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
                   <img src={item.imgURL || 'data:image/svg+xml;base64,...'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '4px' }}>{item.name}</h4>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Hardware Garantizado</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, display: 'block' }}>
                    ${(Number(item.price) * (item.quantity || 1)).toLocaleString()}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-sm)', padding: '4px 8px' }}>
                    <button onClick={() => updateQuantity(idx, (item.quantity || 1) - 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', color: 'var(--foreground)' }}>-</button>
                    <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.quantity || 1}</span>
                    <button onClick={() => updateQuantity(idx, (item.quantity || 1) + 1)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 5px', color: 'var(--foreground)' }}>+</button>
                  </div>

                  <button onClick={() => removeFromCart(idx)} style={{ background:'none', border:'none', color:'var(--destructive)', cursor:'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
                    <Trash2 size={14} /> Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '32px', position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>Resumen</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                   <span>Subtotal</span>
                   <span>${total.toLocaleString()}</span>
                </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--muted-foreground)' }}>
                    <span>Envío</span>
                    <span style={{ fontSize: '0.8rem' }}>Pendiente de selección</span>
                 </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '24px', marginBottom: '32px' }}>
                <span style={{ fontWeight: 600 }}>Subtotal Compra</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>${total.toLocaleString()}</span>
              </div>

            <button 
              className="btn" 
              style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }} 
              onClick={checkout}
              disabled={isProcessing}
            >
              {isProcessing ? 'Procesando...' : (
                <>
                  <CreditCard size={20} /> Proceder al Pago <ArrowRight size={18} />
                </>
              )}
            </button>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textAlign: 'center', marginTop: '16px' }}>
              Pago seguro encriptado por SSL 256-bit.
            </p>
          </div>
        </div>
      )}

      {/* COMPATIBILITY RECOMMENDATIONS */}
      {cartItems.length > 0 && <CartRecommendations cartItems={cartItems} />}
    </div>
  );
}

function CartRecommendations({ cartItems }) {
  const [recommendations, setRecommendations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const categoryIds = cartItems.map(i => i.categoria_id).join(',');
    const productIds = cartItems.map(i => i.id).join(',');
    
    axios.get(`http://localhost:5000/api/products/recommendations/cart?categoryIds=${categoryIds}&productIds=${productIds}`)
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err));
  }, [cartItems]);

  const addToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
            showToast('Cantidad actualizada');
        } else {
            showAlert('Sin stock', 'No hay más unidades disponibles.', 'warning');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast('Añadido al carrito');
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
    window.location.reload(); // Refresh to update recommendations
  };

  if (recommendations.length === 0) return null;

  return (
    <div style={{ marginTop: '80px', borderTop: '1px solid var(--border)', paddingTop: '40px' }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>Completa tu Setup</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
        {recommendations.map(p => (
          <div key={p.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <img src={p.imgURL} alt="p" style={{ height: '120px', objectFit: 'contain' }} />
            <div style={{ fontWeight: 700 }}>${Number(p.price).toLocaleString()}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', flex: 1 }}>{p.name}</div>
            <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '8px' }} onClick={() => addToCart(p)}>Agregar</button>
          </div>
        ))}
      </div>
    </div>
  );
}
