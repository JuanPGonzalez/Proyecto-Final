import React from 'react';

export default function Terms() {
  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '20px' }}>Términos y Condiciones</h2>
      <div className="card" style={{ padding: '40px', lineHeight: '1.6', color: 'var(--foreground)' }}>
        <h3>1. Aceptación de los Términos</h3>
        <p style={{ marginBottom: '20px' }}>Al acceder y utilizar Hardware Haven, usted acepta estar sujeto a estos Términos limitados aplicables a la compra de Hardware informático. Todas las disputas están sujetas a leyes argentinas.</p>
        
        <h3>2. Precios y Pagos</h3>
        <p style={{ marginBottom: '20px' }}>Los precios expuestos son dinámicos base-stock y pueden alterarse según disponibilidad algorítmica sin previo aviso. Sin embargo, el precio al momento del "Checkout" / cierre del carrito se respeta congelado.</p>
        
        <h3>3. Envíos y Logística</h3>
        <p style={{ marginBottom: '20px' }}>El método de envío Standard es gestionado por MercadoEnvíos, mientras que el Express se rige por cadetería interna a costo plano.</p>

        <h3>4. Privacidad</h3>
        <p>Todo dato provisto es encriptado en cumplimiento a normas de recolección de base de datos vigentes.</p>
      </div>
    </div>
  );
}
