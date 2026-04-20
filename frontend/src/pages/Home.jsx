import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // Estado para Modal
  const [loadingModal, setLoadingModal] = useState(false);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const openProductModal = async (product) => {
    setSelectedProduct(product);
    setLoadingModal(true);
    // Disparamos aumento de visitas real
    axios.post(`http://localhost:5000/api/products/${product.id}/view`).catch(console.error);

    // Mockeamos la "AI" generando texto local sintético para simular el Endpoint de LLM sin keys.
    setTimeout(() => {
      setAiData({
        compatibility: 'Compatible con sockets modernos (AM4/AM5 o LGA1700). Uso recomendado con fuentes de 650W+',
        performance: 'Ideal para Gaming en Alto o tareas de Workstation/Renderizado moderado.',
        aiTip: `El componente ${product.name} tiene alta demanda en nuestro catálogo por su excelente costo-beneficio.`
      });
      setLoadingModal(false);
    }, 1200);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setAiData(null);
  };

  const addToCart = (e, product) => {
    e.stopPropagation(); // Evitar abrir modal al clickear el botón
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage')); // Trigger custom para badge
  };

  return (
    <>
      {/* Banner Principal Adaptado a Sicac Dark/Neutral */}
      <div style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', padding: '60px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1px' }}>El poder que necesitas, al instante.</h2>
          <p style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto', color: 'rgba(255,255,255,0.8)' }}>
            Líderes en e-commerce de hardware en Argentina. Procesadores, gráficas y todo para el ecosistema modding a precios analíticos dinámicos.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px' }}>Catálogo Destacado</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {products.map(product => (
            <div 
              key={product.id} 
              className="card" 
              onClick={() => openProductModal(product)}
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
            >
              <div style={{ height: '200px', padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--secondary)' }}>
                <img 
                  src={product.imgURL || 'https://via.placeholder.com/200'} 
                  alt={product.name} 
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '10px' }}>
                  ${Number(product.price).toLocaleString()}
                </span>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--ml-light-text)', fontWeight: 500, flex: 1, lineHeight: '1.4' }}>
                  {product.name}
                </h3>
                <button className="btn" style={{ width: '100%', marginTop: '15px', display:'flex', justifyContent:'center', alignItems:'center', gap:'10px' }} onClick={(e) => addToCart(e, product)}>
                   <ShoppingCart size={16}/> Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Inteligente */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <img src={selectedProduct.imgURL || 'https://via.placeholder.com/200'} alt="img" style={{ width: '150px', height: '150px', objectFit:'contain' }} />
                <div>
                   <h2 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{selectedProduct.name}</h2>
                   <h3 style={{ color: 'var(--accent)', fontSize: '1.8rem', fontWeight: 'bold' }}>${Number(selectedProduct.price).toLocaleString()}</h3>
                   <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginTop: '10px' }}>{selectedProduct.description}</p>
                </div>
             </div>

             <div style={{ backgroundColor: 'var(--secondary)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                   <span style={{ fontSize: '1.5rem' }}>✨</span> Análisis Potenciado por IA
                </h4>
                {loadingModal ? (
                  <p style={{ color: 'var(--muted-foreground)' }}>Analizando heurísticas y compatibilidades...</p>
                ) : (
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                    <p><strong>Rendimiento:</strong> {aiData?.performance}</p>
                    <p style={{ marginTop: '10px' }}><strong>Sinergia:</strong> {aiData?.compatibility}</p>
                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderRadius: 'var(--radius-sm)' }}>
                       💡 {aiData?.aiTip}
                    </div>
                  </div>
                )}
             </div>

             <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button className="btn" style={{ flex: 1 }} onClick={(e) => { addToCart(e, selectedProduct); closeModal(); }}>Agregar al Carrito</button>
                <button className="btn" style={{ flex: 1, backgroundColor: 'transparent', color: 'var(--foreground)', border: '1px solid var(--border)' }} onClick={closeModal}>Cerrar</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
