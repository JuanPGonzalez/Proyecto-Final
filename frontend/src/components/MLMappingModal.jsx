import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Check, Save } from 'lucide-react';

export default function MLMappingModal({ componenteId, componenteName, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load current saved mapping IDs silently on open
  useEffect(() => {
    fetch(`/api/componentes/${componenteId}/ml-mapping`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSelected(data.map(d => ({ 
            id: d.ml_id, 
            title: d.title || 'Guardado en DB', 
            price: d.price || 0 
          })));
        }
      })
      .catch(console.error);
  }, [componenteId]);

  // Debounced Search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setErrorMsg(null);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      performSearch(query);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const performSearch = async (targetQuery) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      console.log("SEARCH QUERY:", targetQuery);
      const res = await fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(targetQuery)}&limit=20`);
      console.log("RESPONSE STATUS:", res.status);
      
      if (!res.ok) {
        setErrorMsg('Error al buscar en MercadoLibre');
        setResults([]);
        return;
      }

      const data = await res.json().catch(() => null);
      console.log("RAW DATA:", data);

      const mappedResults = (data?.results || [])
        .filter(item => item?.price && item.price > 0)
        .slice(0, 20)
        .map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          thumbnail: item.thumbnail,
          condition: item.condition
        }));

      setResults(mappedResults);
    } catch (err) {
      console.error('Network Error:', err);
      setErrorMsg('Error de conexión con MercadoLibre.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (query.trim()) performSearch(query);
  };

  const handleAdd = (item) => {
    const isSelected = selected.some(p => p.id === item.id);
    if (!isSelected) {
      setSelected([...selected, { id: item.id, title: item.title, price: item.price, thumbnail: item.thumbnail }]);
    }
  };

  const handleRemove = (id) => {
    setSelected(selected.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/componentes/${componenteId}/ml-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selected.map(p => p.id)
        })
      });
      
      const data = await res.json();
      if (res.ok && data.ok) {
        alert('Productos vinculados correctamente');
        onClose();
      } else {
        alert('Error al guardar items en backend');
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', width:'850px', maxWidth:'95vw', height:'80vh', borderRadius:'12px', display:'flex', flexDirection:'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f8fafc', borderRadius:'12px 12px 0 0' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:600, color:'#1e293b' }}>Selección de MercadoLibre</h2>
            <p style={{ margin:0, fontSize:'0.85rem', color:'#64748b', marginTop:'4px' }}>Componente: {componenteName} (ID: #{componenteId})</p>
          </div>
          <button onClick={onClose} style={{ background:'white', border:'1px solid #e5e7eb', padding:'8px', borderRadius:'6px', cursor:'pointer', color:'#64748b' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          
          {/* Left: Search Area */}
          <div style={{ flex:2, borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', background:'#ffffff' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9' }}>
              <form onSubmit={handleManualSearch} style={{ display:'flex', gap:'12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                  <input 
                    autoFocus
                    placeholder="Buscar producto (Ej: RTX 4090)..." 
                    value={query} 
                    onChange={e => setQuery(e.target.value)}
                    style={{ width: '100%', padding:'10px 10px 10px 38px', borderRadius:'6px', border:'1px solid #cbd5e1', fontSize:'0.95rem', outline:'none' }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ padding:'0 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:500, transition:'0.2s', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Buscando...' : 'Buscar en MercadoLibre'}
                </button>
              </form>
            </div>
            
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', background:'#f8fafc' }}>
              {loading && <div style={{ color:'#64748b', textAlign:'center', marginTop:'40px', fontWeight:500 }}>Buscando...</div>}
              {errorMsg && <div style={{ color:'#ef4444', textAlign:'center', marginTop:'40px', fontWeight:500 }}>{errorMsg}</div>}
              
              {!loading && !errorMsg && results.length === 0 && query.trim() !== '' && (
                <div style={{ color:'#64748b', textAlign:'center', marginTop:'40px', fontWeight:500 }}>No products found</div>
              )}
              
              {!loading && !errorMsg && results.length === 0 && query.trim() === '' && (
                <div style={{ color:'#94a3b8', textAlign:'center', marginTop:'80px', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                  <Search size={40} style={{ opacity: 0.3 }} />
                  <span>Escribe tu búsqueda para explorar MercadoLibre</span>
                </div>
              )}

              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'12px' }}>
                {results.map(item => {
                  const isSelected = selected.some(p => p.id === item.id);
                  return (
                    <div key={item.id} style={{ display:'flex', gap:'16px', padding:'16px', border:'1px solid #e2e8f0', borderRadius:'10px', background:'white', alignItems:'center', boxShadow:'0 1px 2px rgba(0,0,0,0.05)' }}>
                      <div style={{ width: '70px', height: '70px', backgroundColor: '#f1f5f9', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.thumbnail ? (
                          <img src={item.thumbnail} alt="thumb" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>No Img</div>
                        )}
                      </div>
                      
                      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'4px' }}>
                        <div style={{ fontWeight:600, fontSize:'0.95rem', color:'#1e293b', lineHeight:'1.3' }}>{item.title}</div>
                        <div style={{ color:'#059669', fontWeight:700, fontSize:'1.1rem' }}>${item.price?.toLocaleString()} ARS</div>
                        <div style={{ fontSize:'0.75rem', color:'#94a3b8', display:'flex', gap:'8px' }}>
                           <span>ID: {item.id}</span>
                           {item.condition === 'new' && <span style={{ background:'#dcfce7', color:'#166534', padding:'2px 6px', borderRadius:'100px' }}>Nuevo</span>}
                        </div>
                      </div>
                      
                      <div>
                        {isSelected ? (
                          <button disabled style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#f1f5f9', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:'6px', fontWeight:600, cursor:'not-allowed' }}>
                            <Check size={16} /> Added
                          </button>
                        ) : (
                          <button onClick={() => handleAdd(item)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe', borderRadius:'6px', fontWeight:600, cursor:'pointer', transition:'0.2s', hover:{ background:'#dbeafe' } }}>
                            <Plus size={16} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Selected Area */}
          <div style={{ flex:1.2, display:'flex', flexDirection:'column', background:'#ffffff' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #e5e7eb', background:'#f8fafc' }}>
              <h3 style={{ margin:0, fontSize:'1rem', color:'#1e293b' }}>Productos Seleccionados</h3>
              <p style={{ margin:0, fontSize:'0.85rem', color:'#64748b', marginTop:'4px' }}>{selected.length} listo{selected.length !== 1 ? 's' : ''} para vincular</p>
            </div>
            
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px' }}>
              {selected.length === 0 ? (
                <div style={{ color:'#94a3b8', textAlign:'center', marginTop:'40px', fontSize:'0.9rem' }}>
                  No has agregado productos a la lista.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  {selected.map(p => (
                    <div key={p.id} style={{ padding:'12px', background:'white', border:'1px solid #e2e8f0', borderRadius:'8px', display:'flex', gap:'12px', alignItems:'start', position:'relative', boxShadow:'0 1px 3px rgba(0,0,0,0.02)' }}>
                      <div style={{ flex:1, alignSelf:'center' }}>
                        <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#1e293b', lineHeight:'1.3', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.title}</div>
                        <div style={{ color:'#64748b', fontSize:'0.75rem', marginTop:'4px' }}>{p.id}</div>
                      </div>
                      <button onClick={() => handleRemove(p.id)} style={{ padding:'6px', background:'#fee2e2', border:'1px solid #fecaca', color:'#ef4444', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center' }} title="Remover">
                        <X size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding:'20px 24px', borderTop:'1px solid #e5e7eb', background:'#f8fafc' }}>
              <button 
                onClick={handleSave} 
                disabled={saving || selected.length === 0} 
                style={{ width:'100%', padding:'14px', background: (saving || selected.length === 0) ? '#cbd5e1' : '#10b981', color:'white', border:'none', borderRadius:'8px', fontWeight:600, cursor: (saving || selected.length === 0) ? 'not-allowed' : 'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow: (saving || selected.length === 0) ? 'none' : '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
              >
                <Save size={20} /> 
                {saving ? 'Guardando en DB...' : 'Save Selection'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
