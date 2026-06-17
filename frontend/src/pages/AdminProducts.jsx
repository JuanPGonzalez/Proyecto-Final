import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit2, Trash2, Search, AlertTriangle, Filter, Activity, Download, Upload, Plus, TrendingUp, RefreshCw, Sparkles } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showToast, showConfirm, showAlert } from '../utils/swal';
import Swal from 'sweetalert2';
import ProductFormModal from '../components/ProductFormModal';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingProduct, setEditingProduct] = useState(null);
  const [importing, setImporting] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [stockStatus, setStockStatus] = useState('all'); // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  const [stockExact, setStockExact] = useState('');
  const [activeStatus, setActiveStatus] = useState('active'); // 'all', 'active', 'inactive'
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
    if (location.state?.filterAllStatuses) {
      setActiveStatus('all');
    }
  }, [navigate, location.state]);

  // Handle direct edit from navigation state
  useEffect(() => {
    if (location.state?.editProductId && products.length > 0) {
      const p = products.find(prod => prod.id === location.state.editProductId);
      if (p) {
        handleEdit(p);
        // Clear state to avoid reopening on refresh
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [products, location.state]);

  const fetchProducts = () => {
    axios.get('http://localhost:5000/api/products?includeInactive=true', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => {
        console.error("Error al cargar productos:", err);
      });
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

    let matchesActiveStatus = true;
    if (activeStatus === 'active') matchesActiveStatus = p.isActive === true;
    if (activeStatus === 'inactive') matchesActiveStatus = p.isActive === false;

    return matchesSearch && matchesCategory && matchesStockStatus && matchesExactStock && matchesActiveStatus;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'price_asc') return Number(a.price) - Number(b.price);
    if (sortBy === 'price_desc') return Number(b.price) - Number(a.price);
    if (sortBy === 'stock_asc') return Number(a.stock) - Number(b.stock);
    if (sortBy === 'stock_desc') return Number(b.stock) - Number(a.stock);
    return 0;
  });

  const lowStockProducts = products.filter(p => p.stock > 0 && p.stock < 5 && p.isActive);
  const outOfStockProducts = products.filter(p => p.stock === 0 && p.isActive);

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
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


  const handleReactivate = async (id) => {
    const confirm = await showConfirm('¿Restaurar producto?', 'Este producto volverá a estar visible en la tienda.', 'Sí, restaurar');
    if (!confirm.isConfirmed) return;
    try {
      await axios.patch(`http://localhost:5000/api/products/${id}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Producto restaurado correctamente', 'success');
      fetchProducts();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Error al restaurar', 'error');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategoryId('');
    setStockStatus('all');
    setStockExact('');
    setSortBy('name_asc');
    setActiveStatus('active');
    setCurrentPage(1);
  };
  
  const handleExport = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/products/export', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('Inventario exportado a Excel');
    } catch (error) {
      showAlert('Error', 'No se pudo exportar el inventario', 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx')) {
      showAlert('Formato inválido', 'Por favor selecciona un archivo .xlsx', 'error');
      e.target.value = '';
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://localhost:5000/api/products/import', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const { updated, created, errors } = res.data;
      if (errors && errors.length > 0) {
        console.error("Errores de Excel:", errors);
        showAlert('Importación Parcial', `Actualizados: ${updated}. Creados: ${created}. Fallaron: ${errors.length}. Revisa la consola para más detalles, o verifica que las IDs de Categoría sean válidas.`, 'warning');
      } else {
        showAlert('¡Éxito!', `Proceso completado. Actualizados: ${updated} | Creados: ${created}`, 'success');
      }
      fetchProducts();
    } catch (error) {
      showAlert('Error', error.response?.data?.error || 'Error al procesar el archivo', 'error');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const handleBulkPriceUpdate = async () => {
    if (filteredProducts.length === 0) {
      return showAlert('Aviso', 'No hay productos que coincidan con los filtros actuales para aplicar la corrección.', 'warning');
    }

    const { value: formValues } = await Swal.fire({
      title: 'Corrección Masiva de Precios',
      html: `
        <div style="text-align: left; margin-top: 10px;">
          <p style="font-size: 0.9rem; color: var(--muted-foreground); margin-bottom: 15px;">Se aplicará a los <b>${filteredProducts.length}</b> productos actualmente filtrados.</p>
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Acción:</label>
          <select id="swal-action" class="input-field" style="width: 100%; margin: 0 0 15px 0; height: 42px;">
            <option value="increase">Subir precios</option>
            <option value="decrease">Bajar precios</option>
          </select>
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">Porcentaje (%):</label>
          <input id="swal-percentage" type="number" min="0.1" step="0.1" class="input-field" placeholder="Ej: 10" style="width: 100%; margin: 0; height: 42px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Aplicar Cambios',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--primary)',
      preConfirm: () => {
        const action = document.getElementById('swal-action').value;
        const percentage = document.getElementById('swal-percentage').value;
        if (!percentage || percentage <= 0) {
          Swal.showValidationMessage('Debe ingresar un porcentaje mayor a 0');
        }
        return { action, percentage };
      }
    });

    if (formValues) {
      try {
        const confirm = await showConfirm(
          '¿Estás seguro?', 
          `Vas a ${formValues.action === 'increase' ? 'SUBIR' : 'BAJAR'} los precios de los ${filteredProducts.length} productos filtrados en un ${formValues.percentage}%.`, 
          'Sí, proceder'
        );
        if (!confirm.isConfirmed) return;

        const productIds = filteredProducts.map(p => p.id);

        await axios.post('http://localhost:5000/api/products/bulk-price-update', { ...formValues, productIds }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Precios actualizados correctamente', 'success');
        fetchProducts();
      } catch (err) {
        showAlert('Error', err.response?.data?.error || 'Error al actualizar precios', 'error');
      }
    }
  };

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      
      {/* ALERTS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {outOfStockProducts.length > 0 && (
          <div className="animate-slide-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '15px 25px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertTriangle size={24} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 800 }}>STOCK AGOTADO</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Hay {outOfStockProducts.length} productos sin unidades.</p>
            </div>
            <button className="btn" onClick={() => { setStockStatus('out_of_stock'); setActiveStatus('active'); setCurrentPage(1); }} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>Filtrar</button>
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="animate-slide-in" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '15px 25px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Activity size={24} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 800 }}>STOCK BAJO</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{lowStockProducts.length} productos en alerta de reposición.</p>
            </div>
            <button className="btn" onClick={() => { setStockStatus('low_stock'); setActiveStatus('active'); setCurrentPage(1); }} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>Filtrar</button>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
         <h2 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>Gestión de Inventario</h2>
         <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={handleBulkPriceUpdate} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', backgroundColor: 'var(--accent)', color: 'white' }}>
               <TrendingUp size={18} /> Corrección Masiva
            </button>
            <button className="btn" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
               <Plus size={18} /> Nuevo Producto
            </button>
            <button className="btn btn-outline" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
               <Download size={18} /> <span className="hide-mobile">Exportar</span>
            </button>
            <label className={`btn btn-outline ${importing ? 'opacity-50' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', cursor: 'pointer' }}>
               <Upload size={18} /> <span className="hide-mobile">{importing ? 'Cargando...' : 'Importar'}</span>
               <input type="file" accept=".xlsx" onChange={handleImport} style={{ display: 'none' }} disabled={importing} />
            </label>
         </div>
      </div>

      {/* FILTERS BAR */}
      <div className="card" style={{ padding: '20px', marginBottom: '30px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
         <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'var(--muted-foreground)' }} />
            <input type="text" className="input-field" placeholder="Buscar por nombre..." style={{ paddingLeft: '45px' }} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
         </div>
         <select className="input-field" style={{ width: '180px' }} value={filterCategoryId} onChange={e => { setFilterCategoryId(e.target.value); setCurrentPage(1); }}>
            <option value="">Todas las categorías</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
         </select>
         <select className="input-field" style={{ width: '160px' }} value={stockStatus} onChange={e => { setStockStatus(e.target.value); setCurrentPage(1); }}>
            <option value="all">Todo el stock</option>
            <option value="in_stock">En Stock</option>
            <option value="low_stock">En Alerta</option>
            <option value="out_of_stock">Agotados</option>
         </select>
         <select className="input-field" style={{ width: '150px' }} value={activeStatus} onChange={e => { setActiveStatus(e.target.value); setCurrentPage(1); }}>
            <option value="all">Estados (Todos)</option>
            <option value="active">Activos</option>
            <option value="inactive">Dados de baja</option>
         </select>
         <button className="btn btn-outline" onClick={clearFilters} style={{ padding: '10px 20px' }}>Limpiar</button>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
              <tr>
                <th style={{ padding: '16px' }}>Producto</th>
                <th style={{ padding: '16px' }}>Precio</th>
                <th style={{ padding: '16px' }}>Rango Precio</th>
                <th style={{ padding: '16px' }}>Stock</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map(p => (
                <tr key={p.id} style={{ 
                  borderBottom: '1px solid var(--border)', 
                  backgroundColor: p.isActive === false ? 'rgba(239, 68, 68, 0.05)' : 'transparent', 
                  opacity: p.isActive === false ? 0.7 : 1 
                }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={p.imgURL || 'https://via.placeholder.com/40'} alt="p" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40'; }} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px' }} />
                      <div>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {p.name}
                          {p.isActive === false && <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--destructive)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>DADO DE BAJA</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <span>ID: #{p.id}</span>
                          {p.recentAIUpdate && (
                            <span title="Precio modificado por el Motor de IA en las últimas 24hs" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                              <Sparkles size={10} /> IA Pricing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 700 }}>${Number(p.price).toLocaleString('es-AR')}</td>
                  <td style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                    ${p.precio_min || 0} - {p.precio_max ? `$${p.precio_max}` : '∞'}
                  </td>
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
                      {p.isActive === false ? (
                        <button onClick={() => handleReactivate(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--success)' }} title="Reactivar"><RefreshCw size={18} /></button>
                      ) : (
                        <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--destructive)' }} title="Dar de baja"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</button>
            <span style={{ padding: '8px' }}>{currentPage} / {totalPages}</span>
            <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>Siguiente</button>
          </div>
        )}
      </div>

      <ProductFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={editingProduct} 
        onSuccess={() => { fetchProducts(); fetchCategories(); }} 
      />
    </div>
  );
}
