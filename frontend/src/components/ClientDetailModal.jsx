import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { X, ShoppingBag, Calendar, DollarSign, User, AlertTriangle, MessageSquare } from 'lucide-react';

import { getStatusStyle } from '../constants/statusStyles';
import OrderDetailModal from './OrderDetailModal';

export default function ClientDetailModal({ clientId, clientName, startDate, endDate, onClose }) {
  const [orders, setOrders] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (clientId) {
      fetchAllData();
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
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

  const modalRoot = (
    <>
    <div 
      className="modal-portal-overlay"
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        zIndex: 9999, 
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      {/* Modal Container: Viewport relative via Portal + Flex centering */}
      <div 
        className="card animate-fade-in" 
        onClick={e => e.stopPropagation()}
        style={{ 
          width: 'min(900px, 95vw)', 
          maxHeight: '90vh', 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          position: 'relative',
          backgroundColor: 'var(--card)'
        }}
      >
        
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
        <div style={{ padding: '25px', overflowY: 'auto' }}>
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
                            backgroundColor: getStatusStyle(ticket.status).bg,
                            color: getStatusStyle(ticket.status).text,
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
              <div className="animate-slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => setSelectedOrder(order.id)}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
                      gap: '15px', 
                      padding: '20px', 
                      backgroundColor: 'var(--card)', 
                      borderRadius: '12px', 
                      border: '1px solid var(--border)', 
                      cursor: 'pointer', 
                      transition: 'all 0.2s',
                      alignItems: 'center'
                    }} 
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }} 
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Orden</span>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>#{order.id}</span>
                    </div>
                    
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Fecha</span>
                      <span style={{ fontWeight: 600 }}>{new Date(order.fecha_compra).toLocaleDateString('es-AR')}</span>
                    </div>
                    
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Productos</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.OrderItems?.length > 0 
                          ? order.OrderItems.map(i => i.Product?.name).filter(Boolean).join(', ') || 'Productos Eliminados'
                          : 'Sin registros de artículos'}
                      </div>
                    </div>
                    
                    <div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Estado</span>
                      <span style={{ 
                        padding: '6px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, 
                        backgroundColor: getStatusStyle(order.status).bg, 
                        color: getStatusStyle(order.status).text 
                      }}>
                        {(order.status || 'PENDIENTE').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Total</span>
                      <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>${Number(order.total).toLocaleString('es-AR')}</span>
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
    {selectedOrder && (
      <OrderDetailModal 
        orderId={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    )}
    </>
  );

  return createPortal(modalRoot, document.body);
}
