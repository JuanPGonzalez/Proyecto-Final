import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Recommendations({ context = 'HOME', onOpenModal }) {
  const [groups, setGroups] = useState({ sameCategory: [], related: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const viewed = JSON.parse(localStorage.getItem('viewedProducts') || '[]');
        const viewedIds = viewed.map(v => v.id).join(',');
        const viewedCategories = [...new Set(viewed.map(v => v.category))].join(',');

        const res = await axios.get(`http://localhost:5000/api/products/recommendations?viewedIds=${viewedIds}&viewedCategories=${viewedCategories}`);
        if (res.data && res.data.ok) {
          setGroups(res.data.groups);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
    
    // Add listener so if viewed component changes, we refetch without unmounting (like in Product Details opening new items)
    const handleStorage = () => fetchRecommendations();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (loading) return null;

  const { sameCategory, related } = groups;
  if (sameCategory.length === 0 && related.length === 0) return null;

  let mainTitle = "🔥 Recomendado para ti";
  if (context === 'PRODUCT_DETAIL') mainTitle = "También te podría interesar...";
  if (context === 'CART') mainTitle = "Antes de finalizar tu compra";

  const handleProductClick = (product) => {
    if (context === 'HOME' || context === 'PRODUCT_DETAIL') {
      if (onOpenModal) onOpenModal(product);
    } else if (context === 'CART') {
      // In Cart, navigate to Home and trigger product modal via URL param
      navigate(`/?product=${product.id}`);
    }
  };

  const renderProductCard = (product) => (
    <div 
      key={product.id} 
      className="card" 
      style={{ width: '200px', maxWidth: '200px', flexShrink: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
      onClick={() => handleProductClick(product)}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{ height: '120px', padding: '10px', display: 'flex', justifyContent: 'center', backgroundColor: 'var(--card)' }}>
        <img 
          src={product.imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg=='} 
          alt={product.name} 
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>
      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flex: 1, borderTop: '1px solid var(--border)' }}>
        <h4 style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', fontWeight: 500, flex: 1, lineHeight: '1.4', marginBottom: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.name}
        </h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)' }}>
             ${Number(product.price).toLocaleString('es-AR')}
           </span>
        </div>
        <button 
           className="btn btn-outline" 
           style={{ marginTop: '15px', width: '100%', padding: '8px', fontSize: '0.85rem' }}
           onClick={(e) => { e.stopPropagation(); handleProductClick(product); }}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: '40px', marginBottom: '40px' }} className="animate-fade-in">
      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px' }}>{mainTitle}</h3>
      
      {sameCategory.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <span style={{ padding: '4px 8px', backgroundColor: 'var(--accent)', color: 'white', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Basado en tu actividad</span>
             Porque viste componentes de esta categoría:
          </h4>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'thin' }}>
            {sameCategory.map(renderProductCard)}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <span style={{ padding: '4px 8px', backgroundColor: 'var(--muted)', color: 'var(--foreground)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Sinergia</span>
             Para complementar tu configuración:
          </h4>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '15px', scrollbarWidth: 'thin' }}>
            {related.map(renderProductCard)}
          </div>
        </div>
      )}
    </div>
  );
}
