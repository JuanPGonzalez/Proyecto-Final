import React from 'react';

export default function About() {
  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Sobre Nosotros</h2>
      <div className="card" style={{ padding: '40px', lineHeight: '1.6' }}>
        <h3 style={{ borderBottom: '2px solid var(--ml-yellow)', paddingBottom: '10px', display: 'inline-block' }}>Nuestra Misión</h3>
        <p style={{ marginTop: '20px', marginBottom: '30px' }}>
          En <strong>Hardware Haven</strong> nos apasiona el hardware y el rendimiento puro. Nacimos como una iniciativa universitaria 
          de los alumnos Caro y González (UTN) para optimizar la gestión y experiencia de compra en el e-commerce argentino integrando 
          Inteligencia Artificial y Análisis de Datos (BI).
        </p>

        <h3 style={{ borderBottom: '2px solid var(--ml-yellow)', paddingBottom: '10px', display: 'inline-block' }}>Nuestra Visión</h3>
        <p style={{ marginTop: '20px' }}>
          Garantizar a cada gamer, editor y entusiasta los mejores precios dinámicos según el mercado y el mejor stock de componentes 
          brindando asesoría automatizada pero cálida en cada eslabón del checkout.
        </p>
      </div>
    </div>
  );
}
