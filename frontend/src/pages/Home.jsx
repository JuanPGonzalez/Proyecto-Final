import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, Filter, SlidersHorizontal } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null); // Estado para Modal
  const [loadingModal, setLoadingModal] = useState(false);
  const [aiData, setAiData] = useState(null);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [quickFilter, setQuickFilter] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
  }, []);

  const openProductModal = async (product) => {
    setSelectedProduct(product);
    setLoadingModal(true);
    axios.post(`http://localhost:5000/api/products/${product.id}/view`).catch(console.error);

    try {
      const res = await axios.get(`http://localhost:5000/api/products/${product.id}/ai-analysis`);
      setAiData(res.data);
    } catch (err) {
      console.error(err);
      setAiData({
        performance: 'Error obteniendo datos.',
        compatibility: 'Revisa manual del fabricante.',
        aiTip: 'Intenta nuevamente más tarde.'
      });
    } finally {
      setLoadingModal(false);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setAiData(null);
  };

  const addToCart = (e, product) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    if (quickFilter) {
      const q = quickFilter.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    if (minPrice) {
      result = result.filter(p => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => Number(p.price) <= Number(maxPrice));
    }

    let sorted = [...result];
    if (sortBy === 'priceAsc') sorted.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'priceDesc') sorted.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === 'relevance') sorted.sort((a, b) => (b.views || 0) - (a.views || 0));

    return sorted;
  }, [products, searchQuery, quickFilter, minPrice, maxPrice, sortBy]);

  return (
    <>
      {/* Hero Minimalista estilo "Vercel / Next.js / Clean e-commerce" */}
      {!searchQuery && !quickFilter && (
        <div style={{ backgroundColor: 'var(--background)', padding: '40px 0 30px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-1.5px', color: 'var(--foreground)' }}>
              Hardware Haven.
            </h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--muted-foreground)', marginBottom: '30px', lineHeight: '1.6' }}>
              Encuentra los componentes ideales para tu próximo armado. Optimizamos la experiencia para brindarte seguridad, métricas exactas y precisión analítica.
            </p>
          </div>
        </div>
      )}

      <div className="container layout-filters" style={{ marginTop: '40px' }}>
        
        {/* Barra Lateral de Filtros */}
        <aside className="filter-sidebar">
           <div className="card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                 <SlidersHorizontal size={18} /> Filtros
              </h3>

              {/* Botones de categorías heurísticas */}
              <div style={{ marginBottom: '24px' }}>
                 <h4 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Categorías Populares</h4>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['Intel', 'AMD', 'Nvidia', 'Motherboard', 'RAM'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setQuickFilter(quickFilter === cat ? '' : cat)}
                        style={{ 
                          padding: '6px 12px', fontSize: '0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                          border: quickFilter === cat ? '1px solid var(--foreground)' : '1px solid var(--border)',
                          backgroundColor: quickFilter === cat ? 'var(--foreground)' : 'var(--background)',
                          color: quickFilter === cat ? 'var(--background)' : 'var(--foreground)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                 </div>
              </div>

              {/* Filtro de Precio */}
              <div style={{ marginBottom: '24px' }}>
                 <h4 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Rango de Precio</h4>
                 <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      placeholder="Mín" 
                      className="input-field" 
                      value={minPrice} 
                      onChange={e => setMinPrice(e.target.value)}
                      style={{ padding: '8px', fontSize: '0.9rem' }}
                    />
                    <span style={{ color: 'var(--muted-foreground)' }}>-</span>
                    <input 
                      type="number" 
                      placeholder="Máx" 
                      className="input-field" 
                      value={maxPrice} 
                      onChange={e => setMaxPrice(e.target.value)}
                      style={{ padding: '8px', fontSize: '0.9rem' }}
                    />
                 </div>
              </div>
           </div>
        </aside>

        {/* Galería Principal */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
             <div>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                 {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo de Componentes'}
               </h2>
               <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Modificando {filteredProducts.length} productos</p>
             </div>

             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Ordenar por:</span>
                <select 
                  className="input-field" 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  style={{ width: 'auto', padding: '8px 30px 8px 12px' }}
                >
                  <option value="relevance">Relevancia (Más Vistos)</option>
                  <option value="priceAsc">Menor Precio</option>
                  <option value="priceDesc">Mayor Precio</option>
                </select>
             </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
               <Filter size={40} style={{ opacity: 0.5, margin: '0 auto 20px auto' }} />
               <h3>No se encontraron componentes.</h3>
               <p>Intenta ajustar o limpiar tus filtros actuales.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="card" 
                  onClick={() => openProductModal(product)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ height: '220px', padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--card)' }}>
                    <img 
                      src={product.imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg=='} 
                      alt={product.name} 
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                      ${Number(product.price).toLocaleString()}
                    </span>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', fontWeight: 500, flex: 1, lineHeight: '1.5' }}>
                      {product.name}
                    </h3>
                    <button className="btn btn-outline" style={{ width: '100%', marginTop: '20px', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px' }} onClick={(e) => addToCart(e, product)}>
                       <ShoppingCart size={16}/> Sumar al Carrito
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Modal Inteligente (Re-styled para minimalist view) */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <div style={{ flex: '0 0 160px', height: '160px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', padding: '10px' }}>
                   <img src={selectedProduct.imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg=='} alt="img" style={{ width: '100%', height: '100%', objectFit:'contain' }} />
                </div>
                <div style={{ flex: 1 }}>
                   <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '12px', lineHeight: '1.3' }}>{selectedProduct.name}</h2>
                   <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>${Number(selectedProduct.price).toLocaleString()}</h3>
                   <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedProduct.description}</p>
                </div>
             </div>

             <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 600 }}>
                   <span style={{ fontSize: '1.2rem' }}>✨</span> Insights del Componente
                </h4>
                {loadingModal ? (
                  <p style={{ color: 'var(--muted-foreground)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Cargando heurísticas...</p>
                ) : (
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                    <p><strong style={{ color: 'var(--foreground)' }}>Rendimiento:</strong> {aiData?.performance}</p>
                    <p style={{ marginTop: '10px' }}><strong style={{ color: 'var(--foreground)' }}>Sinergia:</strong> {aiData?.compatibility}</p>
                    <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--foreground)', color: 'var(--background)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px' }}>
                       <span>💡</span> <span style={{ flex: 1 }}>{aiData?.aiTip}</span>
                    </div>
                  </div>
                )}
             </div>

             <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button className="btn" style={{ flex: 1, padding: '14px' }} onClick={(e) => { addToCart(e, selectedProduct); closeModal(); }}>Agregar al Carrito</button>
                <button className="btn btn-outline" style={{ flex: '0 0 120px' }} onClick={closeModal}>Cerrar</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
