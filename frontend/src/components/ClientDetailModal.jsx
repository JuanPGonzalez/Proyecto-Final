import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShoppingBag, Calendar, DollarSign, User } from 'lucide-react';

export default function ClientDetailModal({ clientId, clientName, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchClientOrders();
    }
  }, [clientId]);

  const fetchClientOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/admin/client/${clientId}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data.orders);
    } catch (error) {
      console.error('Error fetching client orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '700px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {clientName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{clientName}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Historial de Compras Recientes</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '30px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando actividad...</div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>Este cliente no tiene órdenes registradas.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {orders.map(order => (
                <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Orden #{order.id}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} /> {new Date(order.fecha_compra).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '10px' }}>
                    {order.OrderItems?.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--foreground)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>• {item.Product?.name}</span>
                        <span style={{ fontWeight: 600 }}>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
                      Pago: {order.payment_method} | Envío: {order.shipping_method}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>${Number(order.total).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '15px 30px', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
