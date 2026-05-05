import React, { useState } from 'react';
import axios from 'axios';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Swal from 'sweetalert2';
import { isAdminRole } from '../constants/roles';
import { useNavigate } from 'react-router-dom';

const AdminStockManager = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!isAdminRole(user)) {
      navigate('/forbidden');
    }
  }, [navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && !selectedFile.name.endsWith('.xlsx')) {
      Swal.fire({
        title: 'Formato inválido',
        text: 'Por favor, selecciona solo archivos .xlsx',
        icon: 'error'
      });
      e.target.value = '';
      return;
    }
    if (selectedFile && selectedFile.size > 2 * 1024 * 1024) {
      Swal.fire({
        title: 'Archivo muy grande',
        text: 'El tamaño máximo permitido es 2MB',
        icon: 'error'
      });
      e.target.value = '';
      return;
    }
    setFile(selectedFile);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
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
      
      Swal.fire({
        title: 'Exportado',
        text: 'Los productos se han exportado correctamente',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire('Error', 'No se pudo exportar la lista de productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Swal.fire('Aviso', 'Selecciona un archivo primero', 'warning');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('http://localhost:5000/api/products/import', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const { updated, skipped, errors, ok } = res.data;

      if (errors && errors.length > 0) {
        Swal.fire({
          title: 'Importación completada con observaciones',
          html: `
            <div style="text-align: left;">
              <p>✅ Actualizados: <b>${updated}</b></p>
              <p>⏭️ Omitidos: <b>${skipped}</b></p>
              <p>❌ Errores: <b>${errors.length}</b></p>
              <hr/>
              <p style="font-size: 0.8rem; color: var(--muted-foreground)">Los errores pueden deberse a stock negativo o IDs inexistentes.</p>
            </div>
          `,
          icon: 'warning',
          confirmButtonText: 'Entendido'
        });
      } else {
        Swal.fire({
          title: '¡Éxito!',
          text: `Se han actualizado ${updated} productos correctamente.`,
          icon: 'success'
        });
      }
      setFile(null);
      // Reset input
      const input = document.getElementById('excel-upload');
      if (input) input.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      const msg = error.response?.data?.error || 'Error al procesar el archivo';
      Swal.fire('Error', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Gestión Masiva de Stock</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Exporta tus productos a Excel, modifica precios o stock y vuelve a importarlos en segundos.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'stretch' }}>
        
        {/* EXPORT CARD */}
        <div className="card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <Download size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Exportar Productos</h3>
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '25px', lineHeight: '1.6' }}>
              Descarga un archivo Excel con todos los productos actuales de la base de datos. 
              Esto te servirá como plantilla para realizar cambios masivos.
            </p>
          </div>
          <button 
            className="btn" 
            onClick={handleExport} 
            disabled={loading}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '50px' }}
          >
            {loading ? 'Procesando...' : <><Download size={20} /> Descargar .xlsx</>}
          </button>
        </div>

        {/* IMPORT CARD */}
        <div className="card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                <Upload size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Importar Actualizaciones</h3>
            </div>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '25px', lineHeight: '1.6' }}>
              Sube tu archivo Excel modificado. El sistema identificará los productos por su ID y actualizará únicamente el <b>Precio</b> y el <b>Stock</b>.
            </p>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <input 
              type="file" 
              id="excel-upload"
              accept=".xlsx" 
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label 
              htmlFor="excel-upload"
              className="input-field"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                cursor: 'pointer',
                borderColor: file ? 'var(--primary)' : 'var(--border)',
                borderStyle: 'dashed',
                borderWidth: '2px',
                height: '50px',
                justifyContent: 'center',
                backgroundColor: file ? 'rgba(56, 189, 248, 0.05)' : 'transparent'
              }}
            >
              <FileSpreadsheet size={20} />
              {file ? <b>{file.name}</b> : 'Seleccionar archivo .xlsx'}
            </label>
          </div>

          <button 
            className="btn" 
            onClick={handleUpload} 
            disabled={loading || !file}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '10px', 
              height: '50px',
              backgroundColor: !file ? 'var(--muted)' : 'var(--primary)'
            }}
          >
            {loading ? 'Subiendo...' : <><CheckCircle size={20} /> Procesar Cambios</>}
          </button>
        </div>

      </div>

      {/* INSTRUCTIONS CARD */}
      <div className="card" style={{ marginTop: '30px', padding: '30px', borderLeft: '5px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
          <Info size={20} color="var(--primary)" />
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Instrucciones y Reglas de Importación</h4>
        </div>
        <ul style={{ color: 'var(--muted-foreground)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 40px', paddingLeft: '20px' }}>
          <li>El archivo debe ser formato <b>.xlsx</b> (Excel).</li>
          <li>Debe contener las columnas: <b>id</b>, <b>price</b>, <b>stock</b>.</li>
          <li>Solo se actualizarán productos existentes (el ID debe coincidir).</li>
          <li>El stock no puede ser negativo.</li>
          <li>Las columnas extras o faltantes (excepto ID) serán ignoradas.</li>
          <li>No se crearán productos nuevos mediante esta herramienta.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminStockManager;
