import React, { useState } from 'react';

export default function SoporteTickets() {
  const [tickets, setTickets] = useState([
    { id: 'TKT-9912', subject: 'Problema ventilador GPU', status: 'Cerrado', date: '10-02-2026' },
  ]);

  const [form, setForm] = useState({ subject: '', desc: '' });

  const createTicket = (e) => {
    e.preventDefault();
    const newTkt = {
      id: `TKT-${Math.floor(Math.random() * 9000) + 1000}`,
      subject: form.subject,
      status: 'Abierto',
      date: new Date().toLocaleDateString()
    };
    setTickets([newTkt, ...tickets]);
    setForm({ subject: '', desc: '' });
    alert('Ticket aperturado con éxito');
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Soporte Técnico Especializado</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '30px', alignItems: 'start' }}>
        
        <div className="card" style={{ padding: '30px' }}>
           <h3>Nuevo Reclamo</h3>
           <p style={{ color: 'var(--ml-light-text)', fontSize: '0.9rem', marginBottom: '20px' }}>Detalla el conflicto o avería con tu compra para que un asesor inicie el RMA.</p>
           <form onSubmit={createTicket} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <input className="input-field" required placeholder="Producto / Asunto" value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})}/>
             <textarea className="input-field" required placeholder="Descripción del defecto..." style={{ minHeight: '120px' }} value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})}/>
             <button type="submit" className="btn">Generar Ticket</button>
           </form>
        </div>

        <div className="card" style={{ padding: '30px' }}>
           <h3>Mis Tickets</h3>
           <div style={{ marginTop: '20px' }}>
             {tickets.map(t => (
               <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', border: '1px solid #eee', borderRadius: '6px', marginBottom: '10px' }}>
                 <div>
                   <strong style={{ color: 'var(--ml-blue)' }}>{t.id}</strong> - {t.subject}
                   <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>{t.date}</div>
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center' }}>
                   <span style={{ 
                     padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold', 
                     backgroundColor: t.status === 'Abierto' ? '#ffeeba' : '#d4edda', 
                     color: t.status === 'Abierto' ? '#856404' : '#155724' 
                   }}>{t.status}</span>
                 </div>
               </div>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
