import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, MapPin, Truck, CreditCard, Box, Calendar, User } from 'lucide-react';
import { getStatusStyle } from '../constants/statusStyles';

export default function OrderDetailModal({ orderId, onClose, zIndex = 10000 }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) return null;

  const modalRoot = (
    <div 
      className="modal-portal-overlay"
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        zIndex: zIndex, 
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="card animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{ 
          width: 'min(800px, 95vw)', 
          maxHeight: '90vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--card)'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Detalle de Orden #{orderId}</h3>
            {order && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Realizada el {new Date(order.fecha_compra).toLocaleString('es-AR')}</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {order && (
              <span style={{ 
                padding: '6px 14px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800,
                backgroundColor: getStatusStyle(order.status).bg,
                color: getStatusStyle(order.status).text,
                textTransform: 'uppercase'
              }}>
                {order.status}
              </span>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '30px', overflowY: 'auto', backgroundColor: 'var(--background)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando orden...</div>
          ) : !order ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--destructive)' }}>Error al cargar la orden.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '20px', backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Cliente</h4>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{order.User?.name || 'Cliente Final'}</div>
                </div>

                <div style={{ padding: '20px', backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}><Truck size={16} /> Envío</h4>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize' }}>{order.tipo_envio || order.shipping_method}</div>
                  {order.tipo_envio !== 'Retiro en tienda' && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                      {order.shipping_address}<br/>
                      {order.localidad}, {order.provincia} ({order.codigo_postal})
                    </div>
                  )}
                </div>

                <div style={{ padding: '20px', backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}><CreditCard size={16} /> Pago</h4>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize' }}>
                    {order.payment_method === 'transfer' ? 'Transferencia' : (order.payment_method === 'mercadopago' ? 'MercadoPago' : order.payment_method)}
                  </div>
                  {order.payment_receipt && (
                    <div style={{ marginTop: '10px' }}>
                      <a href={`http://localhost:5000/${order.payment_receipt}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Ver Comprobante</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div style={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)' }}>
                  <h4 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><Box size={18} /> Artículos Comprados</h4>
                </div>
                <div style={{ padding: '20px' }}>
                  {order.OrderItems?.length > 0 ? (
                    order.OrderItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ flex: 2 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.Product?.name || 'Producto Eliminado'}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Precio Unitario: ${Number(item.priceAtPurchase).toLocaleString('es-AR')}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, color: 'var(--muted-foreground)' }}>
                          x{item.quantity}
                        </div>
                        <div style={{ flex: 1, textAlign: 'right', fontWeight: 800 }}>
                          ${(Number(item.priceAtPurchase) * item.quantity).toLocaleString('es-AR')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
                      No hay registros de productos para esta orden (posiblemente data antigua o de prueba).
                    </div>
                  )}

                  <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '300px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                        <span>Subtotal de productos:</span>
                        <span style={{ fontWeight: 600 }}>${order.OrderItems?.reduce((acc, item) => acc + (Number(item.priceAtPurchase) * item.quantity), 0).toLocaleString('es-AR')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                        <span>Costo de envío:</span>
                        <span style={{ fontWeight: 600 }}>${Number(order.shipping_cost || 0).toLocaleString('es-AR')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0 0 0', marginTop: '10px', borderTop: '2px dashed var(--border)', fontSize: '1.2rem' }}>
                        <span style={{ fontWeight: 800 }}>Total Final:</span>
                        <span style={{ fontWeight: 900, color: 'var(--primary)' }}>${Number(order.total).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalRoot, document.body);
}
