import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Headphones, ChevronRight } from 'lucide-react';

export default function Ayuda() {
  const navigate = useNavigate();

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px' }}>
      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Centro de Ayuda</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Información institucional y soporte técnico</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        
        {/* INFORMACIÓN DEL NEGOCIO */}
        <div className="card" style={{ padding: '30px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ padding: '8px', backgroundColor: 'var(--secondary)', borderRadius: '8px' }}><MapPin size={20} color="var(--accent)"/></div>
            Información del Local
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div style={{ display: 'flex', gap: '15px' }}>
                <MapPin size={20} style={{ color: 'var(--muted-foreground)', marginTop: '4px' }} />
                <div>
                   <div style={{ fontWeight: 600 }}>Dirección Central</div>
                   <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Zeballos 1315, S2000 Rosario, Santa Fe</div>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '15px' }}>
                <Clock size={20} style={{ color: 'var(--muted-foreground)', marginTop: '4px' }} />
                <div>
                   <div style={{ fontWeight: 600 }}>Horarios de Atención</div>
                   <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Lunes a Viernes: 09:00 - 19:00</div>
                   <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Sábados: 09:00 - 13:00</div>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '15px' }}>
                <Phone size={20} style={{ color: 'var(--muted-foreground)', marginTop: '4px' }} />
                <div>
                   <div style={{ fontWeight: 600 }}>Teléfono de Contacto</div>
                   <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>+54 341 448-XXXX</div>
                </div>
             </div>
          </div>

          <div style={{ marginTop: '40px', padding: '24px', backgroundColor: 'var(--background)', borderRadius: '12px', border: '1px solid var(--border)' }}>
             <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
               <Headphones size={18} color="var(--accent)"/> ¿Necesitas Soporte Técnico?
             </h4>
             <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginBottom: '20px' }}>
               Si tienes un problema con un producto o una compra, abre un ticket oficial.
             </p>
             <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => navigate('/soporte')}>
               Abrir Reclamo / Soporte
             </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="card" style={{ padding: '30px' }}>
          <h3 style={{ marginBottom: '24px' }}>Preguntas Frecuentes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <FaqItem 
              q="¿Cómo realizo una compra?" 
              a="Simplemente agrega los productos deseados al carrito y presiona 'Proceder al Pago'. Podrás elegir el método de envío y finalizar el pedido de forma segura."
            />
            <FaqItem 
              q="¿Cuáles son los métodos de envío?" 
              a="Ofrecemos Envío Estándar (3-5 días), Envío Express (24hs) y Retiro en Tienda sin costo en nuestra sucursal de Rosario."
            />
            <FaqItem 
              q="¿Tienen garantía los productos?" 
              a="Todos nuestros componentes cuentan con garantía oficial del fabricante y una garantía local de 6 meses ante fallas de fábrica."
            />
            <FaqItem 
              q="¿Puedo armar mi PC a medida?" 
              a="¡Sí! Utiliza nuestra herramienta 'Armá tu PC' para seleccionar componentes compatibles y obtener un presupuesto instantáneo."
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '15px' }}>
      <div 
        onClick={() => setOpen(!open)} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: 600, color: 'var(--foreground)' }}
      >
        {q}
        <ChevronRight size={18} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>
      {open && (
        <p style={{ marginTop: '10px', color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: '1.5' }}>{a}</p>
      )}
    </div>
  );
}
