import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';

export default function SoporteTickets() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: '', desc: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [responseText, setResponseText] = useState('');
  const [statusSelect, setStatusSelect] = useState('Cerrado');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = isAdminRole(user);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');
    fetchTickets();
  }, [navigate]);

  const fetchTickets = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get('http://localhost:5000/api/tickets', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los reclamos');
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.subject || !form.desc) {
      setError('Completa todos los campos.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5000/api/tickets', {
        subject: form.subject,
        description: form.desc
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets([res.data, ...tickets]);
      setForm({ subject: '', desc: '' });
    } catch (err) {
      console.error(err);
      setError('No se pudo crear el reclamo.');
    }
  };

  const respondTicket = async (ticketId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/tickets/${ticketId}/respond`, {
        status: statusSelect || 'Cerrado',
        respuesta: responseText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(tickets.map(t => t.id === res.data.id ? res.data : t));
      setResponseText('');
      setStatusSelect('');
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el reclamo.');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Soporte Técnico Especializado</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr' : 'minmax(300px, 1fr) 2fr', gap: '30px', alignItems: 'start' }}>
        {!isAdmin && (
          <div className="card" style={{ padding: '30px' }}>
            <h3>Nuevo Reclamo</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginBottom: '20px' }}>Detalla el conflicto con tu compra para que el equipo pueda ayudarte.</p>
            {error && <div style={{ color: 'var(--destructive)', marginBottom: '16px' }}>{error}</div>}
            <form onSubmit={createTicket} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input className="input-field" required placeholder="Producto / Asunto" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              <textarea className="input-field" required placeholder="Descripción del reclamo..." style={{ minHeight: '120px' }} value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
              <button type="submit" className="btn">Generar Ticket</button>
            </form>
          </div>
        )}

        <div className="card" style={{ padding: '30px' }}>
          <h3>{isAdmin ? 'Todos los Reclamos' : 'Mis Tickets'}</h3>
          {loading ? (
            <p style={{ color: 'var(--muted-foreground)', marginTop: '20px' }}>Cargando reclamos...</p>
          ) : tickets.length === 0 ? (
            <div style={{ marginTop: '20px', color: 'var(--muted-foreground)' }}>
              {isAdmin ? 'No hay reclamos registrados todavía.' : 'Aún no has generado reclamos.'}
            </div>
          ) : (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {tickets.map(t => (
                <div key={t.id} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '18px', backgroundColor: 'var(--background)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ color: 'var(--foreground)' }}>{t.id}</strong> - {t.subject}
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '6px' }}>{new Date(t.created_at || t.date || Date.now()).toLocaleDateString()}</div>
                    </div>
                    <span style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: t.status === 'Abierto' ? '#fff3cd' : t.status === 'En Proceso' ? '#d1ecf1' : '#d4edda', color: t.status === 'Abierto' ? '#856404' : t.status === 'En Proceso' ? '#0c5460' : '#155724' }}>{t.status}</span>
                  </div>
                  <p style={{ marginTop: '14px', color: 'var(--muted-foreground)' }}>{t.description}</p>
                  {t.respuesta && (
                    <div style={{ marginTop: '14px', padding: '14px', borderRadius: '10px', backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
                      <strong>Respuesta:</strong>
                      <p style={{ margin: '10px 0 0', color: 'var(--foreground)' }}>{t.respuesta}</p>
                    </div>
                  )}
                  {isAdmin && (
                    <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <select className="input-field" value={statusSelect} onChange={e => setStatusSelect(e.target.value)}>
                        <option value="Cerrado">Cerrado</option>
                        <option value="En Proceso">En Proceso</option>
                        <option value="Abierto">Abierto</option>
                      </select>
                      <input className="input-field" placeholder="Respuesta rápida" value={responseText} onChange={e => setResponseText(e.target.value)} />
                      <button className="btn" style={{ gridColumn: '1 / -1' }} onClick={() => respondTicket(t.id)}>Actualizar Reclamo</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
