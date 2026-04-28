import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit2, Trash2, Search, AlertTriangle, Filter, Activity } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showToast, showConfirm, showAlert } from '../utils/swal';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', stock: '', categoryId: '', newCategoryName: '', imgURL: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [stockStatus, setStockStatus] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [stockExact, setStockExact] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchProducts();
    fetchCategories();

    if (location.state?.filterLowStock) {
      setStockStatus('low_stock');
    }
    if (location.state?.filterOutOfStock) {
      setStockStatus('out_of_stock');
    }
  }, [navigate, location.state]);

  const fetchProducts = () => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(console.error);
  };

  const fetchCategories = () => {
    axios.get('http://localhost:5000/api/products/categories')
      .then(res => setCategories(res.data))
      .catch(console.error);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategoryId === '' || String(p.categoria_id) === filterCategoryId;
    
    let matchesStockStatus = true;
    if (stockStatus === 'in_stock') matchesStockStatus = p.stock > 0;
    if (stockStatus === 'low_stock') matchesStockStatus = p.stock > 0 && p.stock < 5;
    if (stockStatus === 'out_of_stock') matchesStockStatus = p.stock === 0;

    let matchesExactStock = true;
    if (stockExact !== '') matchesExactStock = p.stock === parseInt(stockExact);

    return matchesSearch && matchesCategory && matchesStockStatus && matchesExactStock;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'stock_asc') return Number(a.stock) - Number(b.stock);
    if (sortBy === 'stock_desc') return Number(b.stock) - Number(a.stock);
    return 0;
  });

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5);
  const outOfStockProducts = products.filter(p => p.stock === 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (dataToSend.categoryId !== 'otros') {
        dataToSend.newCategoryName = '';
      }

      if (isEditing) {
        await axios.put(`http://localhost:5000/api/products/${editingId}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Producto actualizado');
      } else {
        await axios.post('http://localhost:5000/api/products', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Producto creado');
      }
      resetForm();
      fetchProducts();
      fetchCategories();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Error al guardar producto', 'error');
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
      categoryId: product.categoria_id || '',
      newCategoryName: '',
      imgURL: product.imgURL || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const confirm = await showConfirm('¿Estás seguro?', '¿Deseas eliminar este componente del inventario?', 'Sí, eliminar');
    if (!confirm.isConfirmed) return;
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Producto eliminado');
      fetchProducts();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', price: '', stock: '', categoryId: '', newCategoryName: '', imgURL: '' });
    setIsEditing(false);
    setEditingId(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategoryId('');
    setStockStatus('all');
    setStockExact('');
    setSortBy('name_asc');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      
      {/* ALERTAS DE STOCK - REPOSICIÓN INMEDIATA */}
      {outOfStockProducts.length > 0 && (
        <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '15px 20px', borderRadius: 'var(--radius-lg)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <AlertTriangle size={24} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>URGENTE: Stock Agotado</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Hay {outOfStockProducts.length} producto(s) sin unidades disponibles.
            </p>
          </div>
          <button className="btn" onClick={() => { setStockStatus('out_of_stock'); setCurrentPage(1); }} style={{ marginLeft: 'auto', backgroundColor: 'white', color: '#ef4444', border: 'none' }}>
            Ver Agotados
          </button>
        </div>
      )}

      {/* ALERTA DE STOCK BAJO - ADVERTENCIA */}
      {lowStockProducts.length > 0 && (
        <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '15px 20px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <Activity size={24} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Advertencia: Stock Bajo</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Hay {lowStockProducts.length} producto(s) en alerta (1-4 unidades).
            </p>
          </div>
          <button className="btn" onClick={() => { setStockStatus('low_stock'); setCurrentPage(1); }} style={{ marginLeft: 'auto', backgroundColor: 'white', color: '#f59e0b', border: 'none' }}>
            Filtrar Alerta
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
         <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>Gestión de Inventario</h2>
         <div style={{ display: 'flex', gap: '10px' }}>
            {isEditing && <button className="btn btn-outline" onClick={resetForm}>Cancelar Edición</button>}
         </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="card" style={{ padding: '20px', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
         <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'var(--muted-foreground)' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Buscar por nombre..." 
              style={{ paddingLeft: '45px' }}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
         </div>
         <select 
           className="input-field" 
           style={{ width: '180px' }}
           value={filterCategoryId}
           onChange={e => { setFilterCategoryId(e.target.value); setCurrentPage(1); }}
         >
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
         </select>
         
         <select 
           className="input-field" 
           style={{ width: '160px' }}
           value={stockStatus}
           onChange={e => { setStockStatus(e.target.value); setCurrentPage(1); }}
         >
            <option value="all">Todo el stock</option>
            <option value="in_stock">En Stock (&gt;0)</option>
            <option value="low_stock">En Alerta (1-4)</option>
            <option value="out_of_stock">Agotados (0)</option>
         </select>

         <div style={{ position: 'relative', width: '140px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--muted-foreground)' }} />
            <input 
              type="number" 
              className="input-field" 
              placeholder="Stock exacto" 
              style={{ paddingLeft: '35px' }}
              value={stockExact}
              min="0"
              onChange={e => { setStockExact(Math.max(0, parseInt(e.target.value) || '')); setCurrentPage(1); }}
            />
         </div>

         <select 
           className="input-field" 
           style={{ width: '150px' }}
           value={sortBy}
           onChange={e => setSortBy(e.target.value)}
         >
            <option value="name_asc">Nombre (A-Z)</option>
            <option value="name_desc">Nombre (Z-A)</option>
            <option value="price_asc">Precio Menor</option>
            <option value="price_desc">Precio Mayor</option>
            <option value="stock_asc">Stock Menor</option>
            <option value="stock_desc">Stock Mayor</option>
         </select>

         <button className="btn btn-outline" onClick={clearFilters} style={{ padding: '10px' }} title="Limpiar Filtros">
            Limpiar
         </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Formulario de Alta/Edición */}
        <div className="card" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isEditing ? 'Editar Componente' : 'Nuevo Componente'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Nombre Completo</label>
              <input type="text" className="input-field" placeholder="Ej: Procesador Intel i9" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Categoría</label>
                <select className="input-field" value={formData.categoryId} onChange={e=>setFormData({...formData, categoryId:e.target.value})} required>
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                  <option value="otros">+ Nueva Categoría</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Stock</label>
                <input type="number" className="input-field" placeholder="Cant." value={formData.stock} onChange={e=>setFormData({...formData, stock:e.target.value})} required />
              </div>
            </div>

            {formData.categoryId === 'otros' && (
              <div className="animate-fade-in">
                <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Nombre de Nueva Categoría</label>
                <input type="text" className="input-field" placeholder="Ej: Refrigeración" value={formData.newCategoryName} onChange={e=>setFormData({...formData, newCategoryName:e.target.value})} required />
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Precio Base ($)</label>
              <input type="number" step="0.01" className="input-field" placeholder="0.00" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} required />
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

        {/* Tabla de Inventario */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Listado de Stock</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{sortedProducts.length} resultados</span>
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
                {paginatedProducts.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No se encontraron productos.</td></tr>
                ) : (
                  paginatedProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <img src={p.imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg=='} alt="p" style={{ width: '40px', height: '40px', objectFit: 'contain', backgroundColor: 'white', border: '1px solid var(--border)', borderRadius: '4px' }} />
                           <div>
                              <div style={{ fontWeight: 600 }}>{p.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>ID: #{p.id} | {p.Category?.descripcion || 'Sin Cat.'}</div>
                           </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 700 }}>${Number(p.price).toLocaleString('es-AR')}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800,
                          backgroundColor: p.stock > 0 ? (p.stock < 5 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)') : 'rgba(239, 68, 68, 0.1)',
                          color: p.stock > 0 ? (p.stock < 5 ? '#f59e0b' : 'var(--success)') : 'var(--destructive)'
                        }}>
                          {p.stock > 0 ? (p.stock < 5 ? `${p.stock} ALERTA` : `${p.stock} DISP.`) : 'AGOTADO'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button onClick={() => handleEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }} title="Editar"><Edit2 size={18} /></button>
                          <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)' }} title="Eliminar"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</button>
              <span style={{ padding: '8px' }}>Página {currentPage} de {totalPages}</span>
              <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages || totalPages === 0}>Siguiente</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
