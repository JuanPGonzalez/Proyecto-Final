import React from 'react';
import { X, Calendar, User, MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function TicketHistoryModal({ isOpen, onClose, status, tickets }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content"
        style={{ padding: 0, maxWidth: '750px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--secondary)'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
              {status === 'abierto' ? (
                <div style={{ padding: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', color: '#f59e0b', display: 'flex' }}>
                  <AlertTriangle size={24} />
                </div>
              ) : (
                <div style={{ padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', color: '#10b981', display: 'flex' }}>
                  <CheckCircle size={24} />
                </div>
              )}
              Historial de Tickets {status === 'abierto' ? 'Abiertos' : 'Cerrados'}
            </h3>
            <p style={{ margin: '8px 0 0 0', color: 'var(--muted-foreground)', fontSize: '0.95rem', fontWeight: 500 }}>
              Revisión de {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrados en el período seleccionado.
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{ 
              padding: '10px', 
              border: 'none', 
              backgroundColor: 'var(--card)', 
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, background-color 0.2s'
            }}
            onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--secondary)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={e => { e.currentTarget.style.backgroundColor = 'var(--card)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <X size={20} color="var(--foreground)" />
          </button>
        </div>

        <div style={{
          padding: '25px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          backgroundColor: 'var(--background)'
        }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted-foreground)' }}>
              <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No se encontraron tickets</p>
              <p style={{ fontSize: '0.9rem' }}>Intenta ajustar el rango de fechas para ver más resultados.</p>
            </div>
          ) : (
            tickets.map(ticket => (
              <div 
                key={ticket.id}
                style={{
                  padding: '20px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.06)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.02)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start', flex: 1 }}>
                     <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary)', 
                        color: 'white', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '1.2rem', 
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {(ticket.user?.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.15rem', color: 'var(--foreground)' }}>
                           {ticket.subject}
                         </h4>
                         <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '6px', color: 'var(--muted-foreground)', fontSize: '0.85rem', fontWeight: 500 }}>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <User size={14} />
                             {ticket.user?.name || 'Usuario desconocido'}
                           </span>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <Calendar size={14} />
                             {new Date(ticket.created_at).toLocaleDateString('es-AR')}
                           </span>
                           <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <Clock size={14} />
                             {new Date(ticket.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                           </span>
                         </div>
                      </div>
                  </div>
                  
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    backgroundColor: ticket.status === 'abierto' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: ticket.status === 'abierto' ? '#f59e0b' : '#10b981',
                    border: `1px solid ${ticket.status === 'abierto' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                  }}>
                    {ticket.status}
                  </span>
                </div>

                <div style={{
                  padding: '16px',
                  backgroundColor: 'var(--secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.95rem',
                  color: 'var(--foreground)',
                  lineHeight: '1.6',
                  position: 'relative'
                }}>
                  <MessageCircle size={16} color="var(--muted-foreground)" style={{ position: 'absolute', top: '18px', left: '16px', opacity: 0.5 }} />
                  <div style={{ paddingLeft: '30px' }}>
                    {ticket.description}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
