import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Search, Download, X, PackagePlus, RefreshCcw, Link } from 'lucide-react';
import MLMappingModal from '../components/MLMappingModal';
import { isAdminRole } from '../constants/roles';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', category: '', imgURL: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [mlSearch, setMlSearch] = useState('');
  const [mlResults, setMlResults] = useState([]);
  const [loadingML, setLoadingML] = useState(false);
  
  // Modal state for ML Mapping
  const [mappingProduct, setMappingProduct] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = () => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(console.error);
  };

  const handleSearchML = async (e) => {
    e.preventDefault();
    if (!mlSearch) return;
    setLoadingML(true);
    try {
      const res = await fetch(`https://api.mercadolibre.com/sites/MLA/search?q=${encodeURIComponent(mlSearch)}&limit=20`);
      
      if (!res.ok) {
        throw new Error('Error en búsqueda ML');
      }

      const data = await res.json();
      
      const results = (data.results || [])
        .filter(item => item.price && item.price > 0)
        .slice(0, 20)
        .map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          thumbnail: item.thumbnail
        }));

      setMlResults(results);
    } catch (err) {
      alert('Error consultando MercadoLibre');
    } finally {
      setLoadingML(false);
    }
  };

  const importFromML = (item) => {
    setFormData({
      ...formData,
      name: item.title,
      price: item.price,
      imgURL: item.thumbnail,
      category: formData.category || 'Hardware'
    });
    setMlResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Producto actualizado');
      } else {
        await axios.post('http://localhost:5000/api/products', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Producto creado');
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      alert('Error al guardar producto');
    }
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || '',
      imgURL: product.imgURL || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este componente del inventario?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', category: '', imgURL: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
         <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>Gestión de Inventario</h2>
         <div style={{ display: 'flex', gap: '10px' }}>
            {isEditing && <button className="btn btn-outline" onClick={resetForm}>Cancelar Edición</button>}
         </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '40px', alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Formulario e Importador */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Importador Mercado Libre */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--primary)', backgroundColor: 'var(--secondary)' }}>
             <h3 style={{ fontSize: '1rem', marginBottom: '15px', display:'flex', alignItems:'center', gap:'8px' }}>
               <Download size={18} /> Importar desde Mercado Libre
             </h3>
             <form onSubmit={handleSearchML} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input 
                  className="input-field" 
                  placeholder="Buscar en ML (ej. RTX 4090)..." 
                  value={mlSearch} 
                  onChange={e => setMlSearch(e.target.value)} 
                />
                <button className="btn" type="submit" disabled={loadingML}>
                  {loadingML ? '...' : <Search size={18} />}
                </button>
             </form>

             {mlResults.length > 0 && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                 {mlResults.map(item => (
                   <div key={item.id} className="card" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => importFromML(item)}>
                      <img src={item.thumbnail} alt="thumb" style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: 'white', borderRadius: '4px' }} />
                      <div style={{ flex: 1 }}>
                         <div style={{ fontWeight: 600, lineHeight: 1.2, marginBottom: '4px' }}>{item.title}</div>
                         <div style={{ color: 'var(--primary)', fontWeight: 700 }}>${item.price.toLocaleString()} ARS</div>
                      </div>
                      <X size={16} style={{ opacity: 0.3 }} />
                   </div>
                 ))}
               </div>
             )}
          </div>

          {/* 2. Formulario Principal */}
          <div className="card" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
            <h3 style={{ marginBottom: '20px', display:'flex', alignItems:'center', gap:'8px' }}>
              {isEditing ? <RefreshCcw size={20}/> : <PackagePlus size={20}/>}
              {isEditing ? 'Actualizar Producto' : 'Nuevo Componente'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Nombre Completo</label>
                <input type="text" className="input-field" placeholder="Ej: Procesador Intel i9" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required/>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Categoría</label>
                  <input type="text" className="input-field" placeholder="GPU, RAM, etc" value={formData.category} onChange={e=>setFormData({...formData, category:e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Stock</label>
                  <input type="number" className="input-field" placeholder="Cant." value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})} required/>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Precio Base ($)</label>
                <input type="number" className="input-field" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} required/>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Descripción / Specs</label>
                <textarea className="input-field" placeholder="Detalles técnicos..." value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} required style={{minHeight:'100px'}}/>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>URL Imagen</label>
                <input type="text" className="input-field" placeholder="http://..." value={formData.imgURL} onChange={e=>setFormData({...formData, imgURL:e.target.value})} />
              </div>

              <button className="btn" type="submit" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>
                {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </form>
          </div>
        </div>

        {/* Lado Derecho: Tabla de Inventario */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Listado de Stock</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{products.length} productos registrados</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px' }}>Producto</th>
                  <th style={{ padding: '16px' }}>Precio</th>
                  <th style={{ padding: '16px' }}>Stock</th>
                  <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>Sin productos en inventario</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <img src={p.imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg=='} alt="p" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '4px' }} />
                           <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>ID: #{p.id} | {p.category || 'Sin Cat.'}</div>
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700 }}>${Number(p.price).toLocaleString()}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                          backgroundColor: p.stock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: p.stock > 0 ? 'var(--success)' : 'var(--destructive)'
                        }}>
                          {p.stock > 0 ? `${p.stock} DISP.` : 'AGOTADO'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }} title="Editar">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => setMappingProduct(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Vincular ML">
                            <Link size={18} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)' }} title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {mappingProduct && (
        <MLMappingModal 
          componenteId={mappingProduct.id} 
          componenteName={mappingProduct.name} 
          onClose={() => setMappingProduct(null)} 
        />
      )}
    </div>
  );
}
