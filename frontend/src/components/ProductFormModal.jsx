import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Loader2, Save } from 'lucide-react';
import { showToast, showAlert } from '../utils/swal';

export default function ProductFormModal({ isOpen, onClose, product = null, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    newCategoryName: '',
    imgURL: '',
    precio_min: '',
    precio_max: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCategories, setFetchingCategories] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product) {
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: product.price || '',
          stock: product.stock || '',
          categoryId: product.categoria_id || '',
          newCategoryName: '',
          imgURL: product.imgURL || '',
          precio_min: product.precio_min !== null ? product.precio_min : '',
          precio_max: product.precio_max !== null ? product.precio_max : ''
        });
      } else {
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          categoryId: '',
          newCategoryName: '',
          imgURL: '',
          precio_min: '',
          precio_max: ''
        });
      }
    }
  }, [isOpen, product]);

  const fetchCategories = async () => {
    setFetchingCategories(true);
    try {
      const res = await axios.get('http://localhost:5000/api/products/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingCategories(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const pBase = Number(formData.price);
    const pMin = formData.precio_min !== '' ? Number(formData.precio_min) : null;
    const pMax = formData.precio_max !== '' ? Number(formData.precio_max) : null;

    if (pMin !== null && pMin > pBase) {
      return showAlert('Validación de Precios', 'El precio mínimo no puede ser mayor al precio base', 'warning');
    }
    if (pMax !== null && pMax < pBase) {
      return showAlert('Validación de Precios', 'El precio máximo no puede ser menor al precio base', 'warning');
    }
    if (pMin !== null && pMax !== null && pMin > pMax) {
      return showAlert('Validación de Precios', 'El precio mínimo no puede ser mayor al precio máximo', 'warning');
    }

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        price: formData.price === '' ? 0 : Number(formData.price),
        stock: formData.stock === '' ? 0 : Number(formData.stock),
        precio_min: formData.precio_min === '' ? null : Number(formData.precio_min),
        precio_max: formData.precio_max === '' ? null : Number(formData.precio_max),
      };

      if (dataToSend.categoryId !== 'otros') {
        dataToSend.newCategoryName = '';
      }

      if (dataToSend.precio_min && dataToSend.precio_max && dataToSend.precio_min > dataToSend.precio_max) {
        showAlert('Error', 'El precio mínimo no puede ser mayor al máximo', 'error');
        setLoading(false);
        return;
      }

      if (product) {
        await axios.put(`http://localhost:5000/api/products/${product.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Producto actualizado');
      } else {
        await axios.post('http://localhost:5000/api/products', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Producto creado');
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Error al guardar producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Nombre Completo</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej: Procesador Intel i9" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Categoría</label>
              <select 
                className="input-field" 
                value={formData.categoryId} 
                onChange={e => setFormData({ ...formData, categoryId: e.target.value })} 
                required
                disabled={fetchingCategories}
              >
                <option value="">Seleccionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.descripcion}</option>)}
                <option value="otros">+ Nueva Categoría</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Stock</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="0" 
                value={formData.stock} 
                onChange={e => setFormData({ ...formData, stock: e.target.value })} 
                required 
              />
            </div>
          </div>

          {formData.categoryId === 'otros' && (
            <div className="animate-fade-in">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Nombre de Nueva Categoría</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ej: Refrigeración" 
                value={formData.newCategoryName} 
                onChange={e => setFormData({ ...formData, newCategoryName: e.target.value })} 
                required 
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Precio Base ($)</label>
              <input 
                type="number" 
                step="0.01" 
                className="input-field" 
                placeholder="0.00" 
                value={formData.price} 
                onChange={e => setFormData({ ...formData, price: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>P. Mínimo ($)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Mín" 
                value={formData.precio_min} 
                onChange={e => setFormData({ ...formData, precio_min: e.target.value })} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>P. Máximo ($)</label>
              <input 
                type="number" 
                className="input-field" 
                placeholder="Máx" 
                value={formData.precio_max} 
                onChange={e => setFormData({ ...formData, precio_max: e.target.value })} 
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>Descripción / Specs</label>
            <textarea 
              className="input-field" 
              placeholder="Detalles técnicos..." 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              required 
              style={{ minHeight: '80px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted-foreground)', marginBottom: '5px', display: 'block' }}>URL Imagen</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="http://..." 
              value={formData.imgURL} 
              onChange={e => setFormData({ ...formData, imgURL: e.target.value })} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose} 
              style={{ flex: 1 }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn" 
              style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {product ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
