import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ShoppingBag, Calendar, DollarSign, User, AlertTriangle, MessageSquare } from 'lucide-react';

export default function ClientDetailModal({ clientId, clientName, startDate, endDate, onClose }) {
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets'); // User focused on tickets now

  useEffect(() => {
    if (clientId) {
      fetchAllData();
    }
  }, [clientId, startDate, endDate]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { startDate, endDate };

      const [ordersRes, ticketsRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/admin/client/${clientId}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        }),
        axios.get(`http://localhost:5000/api/admin/client/${clientId}/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
          params
        })
      ]);

      setOrders(ordersRes.data.orders || []);
      setTickets(ticketsRes.data.tickets || []);
    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="card animate-scale-in" style={{ width: '90%', maxWidth: '750px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        {/* Header */}
        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {clientName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{activeTab === 'tickets' ? 'Historial de Tickets del Cliente' : `Actividad de ${clientName}`}</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{clientName}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)' }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)', opacity: 0.9 }}>
          <button 
            onClick={() => setActiveTab('tickets')}
            style={{ 
              flex: 1, padding: '15px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'tickets' ? 'var(--primary)' : 'var(--muted-foreground)',
              borderBottom: activeTab === 'tickets' ? '2px solid var(--primary)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <MessageSquare size={16} /> Tickets de Soporte
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{ 
              flex: 1, padding: '15px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--muted-foreground)',
              borderBottom: activeTab === 'orders' ? '2px solid var(--primary)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <ShoppingBag size={16} /> Historial de Compras
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '25px', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando información...</div>
          ) : activeTab === 'tickets' ? (
            tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>Este cliente no posee tickets de soporte.</div>
            ) : (
              <div className="animate-slide-in">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>FECHA</th>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>ASUNTO</th>
                      <th style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>ESTADO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontSize: '0.9rem' }}>{new Date(ticket.created_at).toLocaleDateString('es-AR')}</td>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{ticket.subject}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                            backgroundColor: ticket.status === 'abierto' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: ticket.status === 'abierto' ? '#f59e0b' : '#10b981',
                            textTransform: 'capitalize'
                          }}>
                            {ticket.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>Este cliente no tiene órdenes registradas en este período.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.map(order => (
                  <div key={order.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Orden #{order.id}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} /> {new Date(order.fecha_compra).toLocaleDateString('es-AR')}
                      </span>
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
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '15px 30px', borderTop: '1px solid var(--border)', textAlign: 'right', backgroundColor: 'var(--secondary)' }}>
          <button className="btn btn-outline" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
