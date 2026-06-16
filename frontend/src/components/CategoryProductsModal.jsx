import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, Package, DollarSign, Activity } from 'lucide-react';

export default function CategoryProductsModal({ categoryId, categoryName, onClose }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      fetchCategoryProducts();
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [categoryId]);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/products?categoryId=${categoryId}`);
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching category products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!categoryId) return null;

  const modalRoot = (
    <div 
      className="modal-portal-overlay"
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        zIndex: 10000, 
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="card animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{ 
          width: 'min(900px, 95vw)', 
          maxHeight: '90vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '12px' }}>
              <Package size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Productos en {categoryName}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Total: {products.length} productos registrados</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--card)', border: '1px solid var(--border)', cursor: 'pointer', color: 'var(--foreground)', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '30px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--background)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando inventario...</div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>No hay productos registrados en esta categoría.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {products.map(product => (
                <div key={product.id} style={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '12px', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'default'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <div style={{ height: '140px', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {product.imgURL ? (
                      <img src={product.imgURL} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Package size={40} color="var(--muted-foreground)" opacity={0.5} />
                    )}
                  </div>
                  <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: '1.4' }}>{product.name}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontWeight: 800 }}>
                        <DollarSign size={16} />
                        {Number(product.price).toLocaleString('es-AR')}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 700, color: product.stock > 0 ? 'var(--foreground)' : 'var(--destructive)', backgroundColor: product.stock > 0 ? 'var(--secondary)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '20px' }}>
                        <Activity size={14} />
                        {product.stock > 0 ? `${product.stock} ud.` : 'Sin Stock'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalRoot, document.body);
}
