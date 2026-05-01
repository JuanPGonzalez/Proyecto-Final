import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, Filter, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { isAdminRole, isClientRole } from '../constants/roles';
import { formatCurrency, fixImageUrl } from '../utils';
import { showToast, showConfirm, showAlert } from '../utils/swal';

const ITEMS_PER_PAGE = 12;

export default function Home() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [quickFilter, setQuickFilter] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = isAdminRole(user);
  const isClient = isClientRole(user);
  const isLoggedIn = !!user.id;

  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err));
    
    // Always fetch recommendations if someone is logged in
    if (user.id) {
      axios.get(`http://localhost:5000/api/products/recommendations?userId=${user.id}&limit=4`)
        .then(res => setRecommendations(res.data))
        .catch(err => console.error(err));
    }
  }, [user.id]);

  // Reset page when filters change and scroll to top
  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [searchQuery, quickFilter, minPrice, maxPrice, sortBy]);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const openProductModal = (product) => {
    setSelectedProduct(product);
    const userId = user.id;
    axios.post(`http://localhost:5000/api/products/${product.id}/view`, {}, {
      headers: { 'user-id': userId }
    }).catch(console.error);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const addToCart = (e, product) => {
    e.stopPropagation();
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        if (existingItem.quantity < product.stock) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
            showToast('Cantidad actualizada en el carrito');
        } else {
            showAlert('Sin stock suficiente', 'No hay más unidades disponibles de este producto.', 'warning');
            return;
        }
    } else {
        cart.push({ ...product, quantity: 1 });
        showToast('Producto añadido al carrito');
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDeleteProduct = async (e, productId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      return showAlert('Acceso restringido', 'Necesitas permisos de administrador para eliminar productos', 'warning');
    }
    const confirm = await showConfirm('¿Deseas eliminar este producto?', 'Esta acción no se puede deshacer.', 'Eliminar');
    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Producto eliminado');
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
      showAlert('Error', 'No se pudo eliminar el producto', 'error');
    }
  };

  const filteredProducts = useMemo(() => {
    // FILTRO CRITICO: Solo productos con stock > 0
    let result = products.filter(p => Number(p.stock) > 0);

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

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const placeholderImg = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg==';

  return (
    <>
      <div className="container layout-filters" style={{ marginTop: '40px' }}>
        
        <aside className="filter-sidebar">
           <div className="card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                 <SlidersHorizontal size={18} /> Filtros
              </h3>

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

              <div style={{ marginBottom: '24px' }}>
                 <h4 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', marginBottom: '12px' }}>Rango de Precio</h4>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '4px' }}>Precio Mínimo</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        className="input-field" 
                        value={minPrice} 
                        min="0"
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value));
                          setMinPrice(val);
                          if (val !== '' && maxPrice !== '' && val > maxPrice) {
                            setMaxPrice(val);
                          }
                        }}
                        style={{ padding: '12px', fontSize: '1rem', width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted-foreground)', marginLeft: '4px' }}>Precio Máximo</label>
                      <input 
                        type="number" 
                        placeholder="Cualquiera" 
                        className="input-field" 
                        value={maxPrice} 
                        min="0"
                        onChange={e => {
                          const val = e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value));
                          setMaxPrice(val);
                          if (val !== '' && minPrice !== '' && val < minPrice) {
                            setMinPrice(val);
                          }
                        }}
                        style={{ padding: '12px', fontSize: '1rem', width: '100%' }}
                      />
                    </div>
                 </div>
              </div>
           </div>
        </aside>

        <section>
          {isLoggedIn && !isAdmin && recommendations.length > 0 && !searchQuery && !quickFilter && (
            <div style={{ marginBottom: '50px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '8px', height: '24px', backgroundColor: 'var(--accent)', borderRadius: '4px' }}></div>
                Recomendados para ti
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {recommendations.map(p => (
                  <div key={`rec-${p.id}`} className="card" onClick={() => openProductModal(p)} style={{ cursor: 'pointer', padding: '15px' }}>
                    <img src={fixImageUrl(p.imgURL) || placeholderImg} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '10px' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(p.price)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
             <div>
               <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                 {searchQuery ? `Resultados para "${searchQuery}"` : 'Catálogo de Componentes'}
               </h2>
               <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Mostrando {paginatedProducts.length} de {filteredProducts.length} productos</p>
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

          {paginatedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
               <Filter size={40} style={{ opacity: 0.5, margin: '0 auto 20px auto' }} />
               <h3>No se encontraron componentes.</h3>
               <p>Intenta ajustar o limpiar tus filtros actuales.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
                {paginatedProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="card" 
                    onClick={() => openProductModal(product)}
                    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                  >
                    <div style={{ height: '220px', padding: '24px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--card)' }}>
                      <img 
                        src={fixImageUrl(product.imgURL) || placeholderImg} 
                        alt={product.name} 
                        onError={(e) => { e.target.src = placeholderImg; }}
                        style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px', color: 'var(--foreground)' }}>
                        {formatCurrency(product.price)}
                      </span>
                      <h3 style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', fontWeight: 500, flex: 1, lineHeight: '1.5' }}>
                        {product.name}
                      </h3>
                      {isAdmin ? (
                        <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                          <button className="btn btn-outline" style={{ width: '100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px' }} onClick={(e) => { e.stopPropagation(); openProductModal(product); }}>
                            Ver detalle
                          </button>
                          <button className="btn btn-outline" style={{ width: '100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px' }} onClick={(e) => { e.stopPropagation(); navigate('/admin/productos'); }}>
                            Editar
                          </button>
                          <button className="btn" style={{ width: '100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px' }} onClick={(e) => handleDeleteProduct(e, product.id)}>
                            Eliminar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
                          <button className="btn btn-outline" style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'8px' }} onClick={(e) => { e.stopPropagation(); openProductModal(product); }}>
                            Ver detalle
                          </button>
                          <button 
                            className="btn" 
                            disabled={product.stock <= 0}
                            style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', opacity: product.stock <= 0 ? 0.5 : 1 }} 
                            onClick={(e) => addToCart(e, product)}
                          >
                            <ShoppingCart size={16}/> {product.stock > 0 ? 'Comprar' : 'Agotado'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="pagination-btn" 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || totalPages === 0}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {selectedProduct && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
             <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                <div style={{ flex: '0 0 160px', height: '160px', backgroundColor: 'var(--background)', borderRadius: 'var(--radius-lg)', padding: '10px' }}>
                   <img 
                     src={fixImageUrl(selectedProduct.imgURL) || placeholderImg} 
                     alt="img" 
                     onError={(e) => { e.target.src = placeholderImg; }}
                     style={{ width: '100%', height: '100%', objectFit:'contain' }} 
                   />
                </div>
                <div style={{ flex: 1 }}>
                   <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '12px', lineHeight: '1.3' }}>{selectedProduct.name}</h2>
                   <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>{formatCurrency(selectedProduct.price)}</h3>
                   <p style={{ color: 'var(--muted-foreground)', fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedProduct.description}</p>
                </div>
             </div>

              <div style={{ backgroundColor: 'var(--background)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                 <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 600 }}>
                    Descripción Técnica
                 </h4>
                 <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--muted-foreground)' }}>
                   <p>{selectedProduct.description || 'No hay descripción técnica detallada para este producto.'}</p>
                 </div>
              </div>

              {isLoggedIn && !isAdmin && recommendations.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Recomendaciones para ti</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
                    {recommendations.filter(p => p.id !== selectedProduct.id).slice(0, 3).map(rec => (
                      <div key={rec.id} className="card" onClick={() => setSelectedProduct(rec)} style={{ cursor: 'pointer', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                         <img src={fixImageUrl(rec.imgURL) || placeholderImg} alt={rec.name} style={{ width: '100%', height: '80px', objectFit: 'contain' }} />
                         <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{formatCurrency(rec.price)}</span>
                         <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rec.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

             <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                {isAdmin ? (
                  <>
                    <button className="btn" style={{ flex: 1, padding: '14px' }} onClick={() => navigate('/admin/productos')}>
                      Editar producto
                    </button>
                    <button className="btn btn-destructive" style={{ flex: '0 0 120px' }} onClick={async () => { await handleDeleteProduct({ stopPropagation: () => {} }, selectedProduct.id); closeModal(); }}>
                      Eliminar
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      className="btn" 
                      disabled={selectedProduct.stock <= 0}
                      style={{ flex: 1, padding: '14px', opacity: selectedProduct.stock <= 0 ? 0.5 : 1 }} 
                      onClick={(e) => { addToCart(e, selectedProduct); closeModal(); }}
                    >
                      {selectedProduct.stock > 0 ? 'Agregar al Carrito' : 'Agotado'}
                    </button>
                    <button 
                      className="btn btn-outline" 
                      disabled={selectedProduct.stock <= 0}
                      style={{ flex: '0 0 120px', opacity: selectedProduct.stock <= 0 ? 0.5 : 1 }} 
                      onClick={(e) => { addToCart(e, selectedProduct); closeModal(); navigate('/cart'); }}
                    >
                      Comprar
                    </button>
                  </>
                )}
                <button className="btn btn-outline" style={{ flex: '0 0 120px' }} onClick={closeModal}>Cerrar</button>
             </div>
          </div>
        </div>
      )}
    </>
  );
}
