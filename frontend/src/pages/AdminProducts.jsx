import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '', category: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || user.tipoUsuario !== 'admin') {
      return navigate('/forbidden');
    }
    fetchProducts();
  }, [navigate]);

  const fetchProducts = () => {
    axios.get('http://localhost:5000/api/products')
      .then(res => setProducts(res.data))
      .catch(console.error);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/products', newProduct, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Producto guardado correctamente en la BD nativa.');
      fetchProducts();
      setNewProduct({ name: '', description: '', price: '', stock: '', category: '' });
    } catch (err) {
      alert('Error creando producto');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Gestión de Inventario (Componentes)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Formulario Creacion (Movido de Dashboard) */}
        <div className="card" style={{ padding: '30px', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '20px' }}>Alta de Suministro</h3>
          <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" className="input-field" placeholder="Nombre" value={newProduct.name} onChange={e=>setNewProduct({...newProduct, name:e.target.value})} required/>
            <input type="text" className="input-field" placeholder="Categoría (GPU, RAM, etc)" value={newProduct.category} onChange={e=>setNewProduct({...newProduct, category:e.target.value})} />
            <textarea className="input-field" placeholder="Descripción" value={newProduct.description} onChange={e=>setNewProduct({...newProduct, description:e.target.value})} required style={{minHeight:'80px'}}/>
            <div style={{display:'flex', gap:'10px'}}>
              <input type="number" className="input-field" placeholder="Precio ($)" value={newProduct.price} onChange={e=>setNewProduct({...newProduct, price:e.target.value})} style={{flex:1}} required/>
              <input type="number" className="input-field" placeholder="Stock" value={newProduct.stock} onChange={e=>setNewProduct({...newProduct, stock:e.target.value})} style={{flex:1}} required/>
            </div>
            <button className="btn" type="submit">Ingresar a Inventario</button>
          </form>
        </div>

        {/* Listado de Inventario */}
        <div className="card" style={{ padding: '30px', overflowX: 'auto' }}>
          <h3>Catálogo Activo</h3>
          <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '10px' }}>ID</th>
                <th style={{ padding: '10px' }}>Nombre</th>
                <th style={{ padding: '10px' }}>Precio Base</th>
                <th style={{ padding: '10px' }}>Stock</th>
                <th style={{ padding: '10px' }}>Demanda (Vistas)</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px', color: '#999' }}>#{p.id}</td>
                  <td style={{ padding: '10px', fontWeight: '500' }}>{p.name}</td>
                  <td style={{ padding: '10px' }}>${Number(p.price).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>
                     <span style={{ color: p.stock > 0 ? '#00a650' : '#d9534f' }}>
                       {p.stock > 0 ? p.stock : 'Agotado'}
                     </span>
                  </td>
                  <td style={{ padding: '10px' }}>{p.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
