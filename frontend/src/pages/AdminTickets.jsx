import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Clock, CheckCircle, Send, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { isAdminRole } from '../constants/roles';
import { showToast, showAlert, showConfirm } from '../utils/swal';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchTickets();
  }, [navigate, currentPage, statusFilter, sortBy]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tickets?page=${currentPage}&limit=10&status=${statusFilter}&sortBy=${sortBy}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.tickets);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/tickets/${selectedTicket.id}/respond`, 
        { respuesta: reply, status: 'Respondido' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReply('');
      setSelectedTicket(null);
      fetchTickets();
      showToast('Respuesta enviada');
    } catch (err) {
      showAlert('Error', 'No se pudo enviar la respuesta', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    const confirm = await showConfirm('¿Deseas cerrar este ticket?', 'El usuario ya no podrá responder.');
    if (!confirm.isConfirmed) return;
    try {
      await axios.put(`http://localhost:5000/api/tickets/${selectedTicket.id}/respond`, 
        { status: 'Cerrado' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedTicket(null);
      fetchTickets();
      showToast('Ticket cerrado');
    } catch (err) {
      showAlert('Error', 'No se pudo cerrar el ticket', 'error');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Gestión de Reclamos y Soporte</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Centro de atención al cliente y resolución de tickets.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        
        {/* Lista de Tickets */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--secondary)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Tickets Recientes</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select className="input-field" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Respondido">Respondido</option>
                <option value="Cerrado">Cerrado</option>
              </select>
              <select className="input-field" value={sortBy} onChange={e => { setSortBy(e.target.value); setCurrentPage(1); }} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                <option value="date_desc">Más recientes</option>
                <option value="date_asc">Más antiguos</option>
              </select>
            </div>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {tickets.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No hay reclamos pendientes.</div>
            ) : (
              tickets.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => setSelectedTicket(t)}
                  style={{ 
                    padding: '20px', borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    backgroundColor: selectedTicket?.id === t.id ? 'oklch(0.627 0.194 259.215 / 5%)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.subject}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={12} /> {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>{currentPage} / {totalPages}</span>
            <button className="pagination-btn" disabled={currentPage >= totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Detalle y Respuesta */}
        <div className="card" style={{ padding: '30px', minHeight: '400px' }}>
          {selectedTicket ? (
            <div className="animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>ID Usuario: {selectedTicket.user_id}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Fecha del reclamo: {new Date(selectedTicket.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-md)', marginBottom: '30px' }}>
                 <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Descripción del problema:</h4>
                 <p style={{ lineHeight: '1.6' }}>{selectedTicket.description}</p>
              </div>

              {selectedTicket.respuesta ? (
                <div style={{ padding: '20px', borderLeft: '4px solid var(--success)', backgroundColor: 'oklch(0.627 0.194 149.214 / 5%)', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={18} color="var(--success)" /> Respuesta enviada:
                  </h4>
                  <p style={{ color: 'var(--muted-foreground)' }}>{selectedTicket.respuesta}</p>
                </div>
              ) : (
                <form onSubmit={handleReply}>
                  <h4 style={{ marginBottom: '15px' }}>Responder al Cliente:</h4>
                  <textarea 
                    className="input-field" 
                    placeholder="Escribe aquí tu respuesta oficial..." 
                    style={{ minHeight: '150px', marginBottom: '20px' }}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn" type="submit" disabled={loading} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
                      {loading ? 'Enviando...' : <><Send size={18} /> Enviar Respuesta</>}
                    </button>
                    <button className="btn btn-outline" type="button" onClick={handleClose} style={{ color: 'var(--destructive)', borderColor: 'var(--destructive)' }}>
                      Cerrar Ticket
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--muted-foreground)', gap: '15px' }}>
               <MessageSquare size={50} opacity={0.2} />
               <p>Selecciona un ticket para ver los detalles y responder.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const isResolved = status === 'Respondido';
  const isClosed = status === 'Cerrado';
  
  return (
    <span style={{ 
      fontSize: '0.7rem', fontWeight: 800, padding: '4px 8px', borderRadius: '4px',
      backgroundColor: isClosed ? 'rgba(0,0,0,0.1)' : (isResolved ? 'oklch(0.627 0.194 149.214 / 15%)' : 'oklch(0.6 0.118 266.355 / 15%)'),
      color: isClosed ? 'var(--muted-foreground)' : (isResolved ? 'var(--success)' : 'var(--primary)')
    }}>
      {status.toUpperCase()}
    </span>
  );
}
