import React, { useState, useEffect } from 'react';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(items);
  }, []);

  const removeFromCart = (index) => {
    const newItems = [...cartItems];
    newItems.splice(index, 1);
    setCartItems(newItems);
    localStorage.setItem('cart', JSON.stringify(newItems));
  };

  const total = cartItems.reduce((acc, item) => acc + Number(item.price), 0);

  const checkout = () => {
    alert('Funcionalidad de Checkout procesando. En un caso real llamaría al backend para insertar en compra/linea_compra.');
    localStorage.removeItem('cart');
    setCartItems([]);
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ marginBottom: '30px' }}>Mi Carrito</h2>
      
      {cartItems.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--ml-light-text)' }}>Tu carrito está vacío</h3>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {cartItems.map((item, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', padding: '20px', alignItems: 'center', gap: '20px' }}>
                <img src={item.imageUrl || item.imgURL} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                <div style={{ flex: 1 }}>
                  <h4>{item.name}</h4>
                  <p style={{ color: 'var(--ml-light-text)', fontSize: '0.9rem' }}>Cantidad: 1</p>
                </div>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${Number(item.price).toLocaleString()}</span>
                </div>
                <button onClick={() => removeFromCart(idx)} style={{ background:'none', border:'none', color:'#d9534f', cursor:'pointer' }}>Eliminar</button>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: '30px', height: 'fit-content' }}>
            <h3>Resumen de compra</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <span>Total</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>${total.toLocaleString()}</span>
            </div>
            <button className="btn" style={{ width: '100%', marginTop: '20px' }} onClick={checkout}>
              Finalizar Compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
