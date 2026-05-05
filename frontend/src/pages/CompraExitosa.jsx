import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Mail, Package, MapPin, CreditCard, Upload, FileText, AlertCircle, Loader2, Landmark, Info } from 'lucide-react';
import { showAlert } from '../utils/swal';

export default function CheckoutSummary() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Datos de la orden guardados en el paso anterior
  const order = location.state || JSON.parse(localStorage.getItem('lastOrder') || 'null');
  
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    // Si no hay datos de orden, volver al carrito
    if (!order || !order.items) {
      navigate('/cart');
    }
  }, [order, navigate]);

  if (!order || !order.items) return null;

  const { items, shipping, total, paymentMethod, paymentDetails } = order;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        return showAlert('Archivo no soportado', 'Solo se permiten imágenes (JPG, PNG) o PDF.', 'error');
      }
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return showAlert('Archivo muy grande', 'El comprobante no debe superar los 5MB.', 'error');
      }
      setProofFile(file);
    }
  };

  const handleConfirmOrder = async () => {
    // Validación de comprobante para transferencia
    if (paymentMethod === 'transfer' && !proofFile) {
      return showAlert('Comprobante requerido', 'Debes adjuntar el comprobante de transferencia para finalizar la compra.', 'warning');
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const formData = new FormData();
      
      const orderPayload = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity || 1,
          priceAtPurchase: item.price
        })),
        shippingAddress: shipping.method === 'tienda' ? null : shipping.address,
        provincia: shipping.method === 'tienda' ? null : shipping.provincia,
        localidad: shipping.method === 'tienda' ? null : shipping.localidad,
        localidadId: shipping.localidadId,
        codigoPostal: shipping.method === 'tienda' ? null : shipping.codigoPostal,
        shippingMethod: shipping.method,
        shippingCost: shipping.cost,
        paymentMethod: paymentMethod,
        paymentDetails: paymentMethod === 'card' ? paymentDetails : null
      };

      formData.append('orderData', JSON.stringify(orderPayload));
      
      // Solo adjuntar si es transferencia
      if (paymentMethod === 'transfer' && proofFile) {
        formData.append('proof', proofFile);
      }

      const res = await axios.post('http://localhost:5000/api/orders', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        setOrderId(res.data.orderId);
        setIsConfirmed(true);
        
        // Limpieza de estados y carrito
        localStorage.removeItem('cart');
        localStorage.removeItem('lastOrder');
        window.dispatchEvent(new Event('storage'));
      }
      
    } catch (err) {
      console.error('Checkout Confirmation Error:', err);
      const msg = err.response?.data?.error || 'Ocurrió un error al procesar tu pedido. Por favor, intenta de nuevo.';
      showAlert('Error en el Pedido', msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // VISTA DE ÉXITO (Confirmación)
  if (isConfirmed) {
    return (
      <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px', maxWidth: '700px' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', border: '1px solid var(--success)', backgroundColor: 'oklch(0.627 0.194 149.214 / 5%)' }}>
          <CheckCircle size={60} color="var(--success)" style={{ marginBottom: '20px' }} />
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '10px' }}>¡Orden Recibida!</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1.1rem' }}>
            Tu pedido #{orderId} ha sido registrado exitosamente.
          </p>
          
          {paymentMethod === 'transfer' && (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
              <Info size={20} />
              <span style={{ fontWeight: 600 }}>Tu pago será validado por nuestro equipo a la brevedad.</span>
            </div>
          )}
          
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'left' }}>
             <h3 style={{ fontSize: '1rem', marginBottom: '15px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>Resumen de Entrega</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <MapPin size={16} color="var(--muted-foreground)" />
                   <span><strong>Ubicación:</strong> {shipping.method === 'tienda' ? 'Retiro en Zeballos 1315' : `${shipping.address}, ${shipping.localidad}`}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <CreditCard size={16} color="var(--muted-foreground)" />
                   <span><strong>Método de Pago:</strong> {paymentMethod.toUpperCase()}</span>
                </div>
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 800 }}>
                   <span>Total</span>
                   <span style={{ color: 'var(--accent)' }}>${total.toLocaleString()}</span>
                </div>
             </div>
          </div>

          <button className="btn" style={{ marginTop: '40px', padding: '12px 40px' }} onClick={() => navigate('/')}>
            Volver a la Tienda
          </button>
        </div>
      </div>
    );
  }

  // VISTA DE RESUMEN (Antes de confirmar)
  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px', maxWidth: '800px' }}>
      <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '5px' }}>Confirmación Final</h2>
      <p style={{ color: 'var(--muted-foreground)', marginBottom: '35px' }}>Verifica que todos los datos sean correctos antes de finalizar.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          <div className="card" style={{ padding: '25px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><MapPin size={20} color="var(--primary)" /> Detalles de Envío</h4>
            <div style={{ fontSize: '0.95rem' }}>
              <p style={{ fontWeight: 700, margin: '0 0 5px 0' }}>{shipping.method === 'tienda' ? 'Retiro en Tienda' : 'Entrega a Domicilio'}</p>
              <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>
                {shipping.method === 'tienda' 
                  ? 'Zeballos 1315, Rosario, Santa Fe' 
                  : `${shipping.address}, ${shipping.localidad}, ${shipping.provincia}`}
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '25px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}><CreditCard size={20} color="var(--primary)" /> Pago Seleccionado</h4>
            <div style={{ fontSize: '0.95rem', marginBottom: paymentMethod === 'transfer' ? '20px' : '0' }}>
              <p style={{ fontWeight: 700, margin: '0 0 5px 0', textTransform: 'capitalize' }}>
                {paymentMethod === 'transfer' ? 'Transferencia Bancaria' : (paymentMethod === 'card' ? 'Tarjeta de Crédito / Débito' : 'Efectivo')}
              </p>
              {paymentMethod === 'card' && <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Procesado por pasarela segura</p>}
            </div>

            {paymentMethod === 'transfer' && (
              <div style={{ marginTop: '10px', padding: '20px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
                <label style={{ display: 'block', marginBottom: '15px', fontWeight: 800, fontSize: '0.85rem', color: 'var(--primary)' }}>SUBIR COMPROBANTE DE PAGO</label>
                
                <div style={{ position: 'relative' }}>
                  <input type="file" id="proof-upload" accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                  <label 
                    htmlFor="proof-upload" 
                    className="card"
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', 
                      padding: '30px', cursor: 'pointer', transition: 'all 0.2s', backgroundColor: 'var(--card)',
                      border: proofFile ? '2px solid var(--success)' : '2px dashed var(--border)'
                    }}
                  >
                    {proofFile ? (
                      <>
                        <FileText size={32} color="var(--success)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{proofFile.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Clic para cambiar archivo</span>
                      </>
                    ) : (
                      <>
                        <Upload size={32} color="var(--muted-foreground)" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Seleccionar Comprobante (JPG, PNG, PDF)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Límite: 5MB</span>
                      </>
                    )}
                  </label>
                </div>
                {!proofFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: '#f59e0b', fontSize: '0.8rem' }}>
                    <AlertCircle size={14} />
                    <span>Obligatorio para procesar transferencias</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '30px', height: 'fit-content' }}>
          <h4 style={{ marginBottom: '20px', fontWeight: 800 }}>Resumen de Costos</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>{item.quantity}x {item.name}</span>
                <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
               <span style={{ color: 'var(--muted-foreground)' }}>Subtotal Productos</span>
               <span>${(total - shipping.cost).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
               <span style={{ color: 'var(--muted-foreground)' }}>Costo de Envío</span>
               <span style={{ color: shipping.cost === 0 ? 'var(--success)' : 'inherit' }}>{shipping.cost === 0 ? 'Gratis' : `$${shipping.cost.toLocaleString()}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.4rem', marginTop: '10px' }}>
               <span>Total Final</span>
               <span style={{ color: 'var(--primary)' }}>${total.toLocaleString()}</span>
            </div>
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', marginTop: '30px', padding: '16px', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            disabled={loading || (paymentMethod === 'transfer' && !proofFile)}
            onClick={handleConfirmOrder}
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Procesando Pedido...</>
            ) : 'Finalizar Compra'}
          </button>
          
          <button 
            onClick={() => navigate('/pago')}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted-foreground)', marginTop: '15px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Volver y editar pago
          </button>
        </div>
      </div>
    </div>
  );
}
