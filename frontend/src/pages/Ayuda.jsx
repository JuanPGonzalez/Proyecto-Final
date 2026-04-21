import React, { useState } from 'react';

export default function Ayuda() {
  const [formData, setFormData] = useState({ name: '', subject: '', message: '' });

  const sendEmail = (e) => {
    e.preventDefault();
    alert('Consulta enviada. Nuestro equipo te contactará pronto.');
    setFormData({ name: '', subject: '', message: '' });
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '30px' }}>Centro de Ayuda</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
        
        {/* FAQ */}
        <div className="card" style={{ padding: '30px' }}>
          <h3>Preguntas Frecuentes</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '20px' }}>
            <li style={{ marginBottom: '20px' }}>
              <strong>¿Cómo puedo realizar un pedido?</strong>
              <p style={{ color: 'var(--muted-foreground)' }}>Selecciona los productos, agrégalos al carrito y sigue el proceso de checkout.</p>
            </li>
            <li style={{ marginBottom: '20px' }}>
              <strong>¿Cómo rastreo mi pedido?</strong>
              <p style={{ color: 'var(--muted-foreground)' }}>Recibirás un email automático de seguimiento una vez enviado tu paquete.</p>
            </li>
            <li>
              <strong>¿Aceptan devoluciones?</strong>
              <p style={{ color: 'var(--muted-foreground)' }}>Sí, cuentas con 30 días naturales con tu recibo original de compra.</p>
            </li>
          </ul>
        </div>

        {/* Formulario */}
        <div className="card" style={{ padding: '30px' }}>
          <h3>Contáctanos</h3>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '20px' }}>¿No encuentras lo que buscas? Déjanos un mensaje.</p>
          <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Nombre" required className="input-field" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} />
            <input type="text" placeholder="Asunto" required className="input-field" value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} />
            <textarea placeholder="Mensaje..." required className="input-field" style={{ minHeight: '100px' }} value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} />
            <button type="submit" className="btn">Enviar Consulta</button>
          </form>
        </div>

      </div>
    </div>
  );
}
