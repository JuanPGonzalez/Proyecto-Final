import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle, Save } from 'lucide-react';

export default function MLMappingModal({ componenteId, componenteName, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Funciones de extracción
  const extractMLId = (url) => {
    if (!url) return null;
    // 1. Buscar item_id
    const itemMatch = url.match(/item_id:?(MLA\d+)/);
    if (itemMatch) return itemMatch[1];

    // 2. Buscar IDs largos (10+ números)
    const matches = url.match(/MLA\d{10,}/g);
    if (matches) return matches[0];

    return null;
  };

  const detectedId = extractMLId(query);

  // Cargar IDs actuales al abrir
  useEffect(() => {
    fetch(`/api/componentes/${componenteId}/ml-mapping`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // data items: { id, componente_id, ml_id, price, title }
          setSelected(data.map(d => ({ id: d.ml_id, title: d.title || 'Guardado', price: d.price || 0 })));
        }
      })
      .catch(console.error);
  }, [componenteId]);

  const searchML = async (e) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const searchQuery = detectedId ? detectedId : query;
      const res = await fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data.results.slice(0, 10));
    } catch (err) {
      console.error('Error buscando en ML', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (item) => {
    const isSelected = selected.some(p => p.id === item.id);
    if (isSelected) {
      setSelected(selected.filter(p => p.id !== item.id));
    } else {
      setSelected([...selected, { id: item.id, title: item.title, price: item.price, thumbnail: item.thumbnail }]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/componentes/${componenteId}/ml-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: selected.map(p => p.id),
          prices: selected.map(p => p.price),
          titles: selected.map(p => p.title)
        })
      });
      if (res.ok) {
        alert('Items vinculados correctamente');
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
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:'white', width:'800px', maxWidth:'90vw', maxHeight:'90vh', borderRadius:'8px', display:'flex', flexDirection:'column' }}>
        
        {/* Header */}
        <div style={{ padding:'20px', borderBottom:'1px solid #ddd', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h2 style={{ margin:0, fontSize:'1.2rem' }}>Vincular ML - {componenteName}</h2>
            <p style={{ margin:0, fontSize:'0.85rem', color:'#666' }}>ID Componente: #{componenteId}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer' }}><X /></button>
        </div>

        {/* Content */}
        <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
          
          {/* Left: Search */}
          <div style={{ flex:2, borderRight:'1px solid #ddd', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'20px', borderBottom:'1px solid #eee' }}>
              <form onSubmit={searchML} style={{ display:'flex', gap:'10px' }}>
                <input 
                  autoFocus
                  placeholder="Buscar componente en ML..." 
                  value={query} 
                  onChange={e => setQuery(e.target.value)}
                  style={{ flex:1, padding:'10px', borderRadius:'4px', border:'1px solid #ccc' }}
                />
                <button type="submit" disabled={loading} style={{ padding:'10px 15px', background:'#3b82f6', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>
                  {loading ? '...' : <Search size={18} />}
                </button>
              </form>
              {detectedId && (
                <div style={{ marginTop: '8px', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  ✅ ID detectado: {detectedId}
                </div>
              )}
            </div>
            
            <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
              {results.length === 0 && !loading && <div style={{ color:'#888', textAlign:'center', marginTop:'20px' }}>Inicia una búsqueda</div>}
              {results.map(item => {
                const isSelected = selected.some(p => p.id === item.id);
                return (
                  <div key={item.id} onClick={() => toggleSelect(item)} style={{ display:'flex', gap:'15px', padding:'15px', border:'1px solid #eaeaea', marginBottom:'10px', borderRadius:'8px', cursor:'pointer', background: isSelected ? '#eff6ff' : 'white', borderColor: isSelected ? '#3b82f6' : '#eaeaea', alignItems:'center' }}>
                    <img src={item.thumbnail} alt="thumb" style={{ width:'60px', height:'60px', objectFit:'contain' }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:600, fontSize:'0.9rem', marginBottom:'5px' }}>{item.title}</div>
                      <div style={{ color:'#3b82f6', fontWeight:700 }}>${item.price.toLocaleString()}</div>
                      <div style={{ fontSize:'0.75rem', color:'#888', marginTop:'4px' }}>ID: {item.id}</div>
                    </div>
                    <div>
                      {isSelected && <CheckCircle size={24} color="#3b82f6" />}
                      {!isSelected && <div style={{ width:'24px', height:'24px', border:'2px solid #ccc', borderRadius:'50%' }}></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Selected & Preview */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f8fafc' }}>
            <div style={{ padding:'20px', borderBottom:'1px solid #ddd' }}>
              <h3 style={{ margin:0, fontSize:'1rem' }}>Previsualización</h3>
              <p style={{ margin:0, fontSize:'0.85rem', color:'#666' }}>{selected.length} ítems seleccionados</p>
            </div>
            
            <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
              {selected.length === 0 && <div style={{ color:'#888', textAlign:'center' }}>No has seleccionado nada</div>}
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {selected.map(p => (
                  <div key={p.id} style={{ padding:'10px', background:'white', border:'1px solid #e2e8f0', borderRadius:'6px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.85rem' }}>
                    <div style={{ overflow:'hidden' }}>
                      <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.title}</div>
                      <div style={{ color:'#888', fontSize:'0.75rem' }}>{p.id}</div>
                    </div>
                    <button onClick={() => toggleSelect(p)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:'5px' }}><X size={14}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding:'20px', borderTop:'1px solid #ddd', background:'white' }}>
              <button onClick={handleSave} disabled={saving || selected.length === 0} style={{ width:'100%', padding:'12px', background:'#10b981', color:'white', border:'none', borderRadius:'6px', fontWeight:600, cursor: (saving || selected.length===0) ? 'not-allowed' : 'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity: (saving || selected.length===0) ? 0.6 : 1 }}>
                <Save size={18} /> {saving ? 'Guardando...' : 'Guardar y Vincular IDs'}
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
