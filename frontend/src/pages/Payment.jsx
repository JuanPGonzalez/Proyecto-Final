import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Banknote, ShieldCheck, ChevronRight, Landmark, Info } from 'lucide-react';
import { getStorageItem } from '../utils/storage';
import { showAlert } from '../utils/swal';

export default function Payment() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    idType: 'DNI',
    idNumber: '',
    contact: ''
  });
  const [errors, setErrors] = useState({});

  const cart = getStorageItem('cart', []);
  const shippingInfo = getStorageItem('last_shipping', { cost: 0, address: '', method: 'standard' });
  
  const subtotal = cart.reduce((acc, p) => acc + (Number(p.price) * (p.quantity || 1)), 0);
  const total = subtotal + shippingInfo.cost;

  const isLocalPickup = shippingInfo.method === 'tienda';

  useEffect(() => {
    if (cart.length === 0) navigate('/cart');
    // Si no es retiro en local y estaba en cash, cambiar a card
    if (!isLocalPickup && method === 'cash') {
      setMethod('card');
    }
  }, [cart, navigate, isLocalPickup]);

  const validate = () => {
    let newErrors = {};
    if (method === 'card') {
      if (!/^\d{13,19}$/.test(cardData.number.replace(/\s/g, ''))) newErrors.number = 'Número de tarjeta inválido (13-19 dígitos)';
      if (!cardData.name.trim()) newErrors.name = 'Nombre requerido';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardData.expiry)) {
        newErrors.expiry = 'Formato MM/YY requerido';
      } else {
        const [month, year] = cardData.expiry.split('/');
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        if (expiryDate < new Date()) newErrors.expiry = 'La tarjeta ha expirado';
      }
      if (!/^\d{3,4}$/.test(cardData.cvv)) newErrors.cvv = 'CVV inválido (3-4 dígitos)';
      if (!cardData.idNumber.trim()) newErrors.idNumber = 'Número de identificación requerido';
      if (!cardData.contact.trim()) newErrors.contact = 'Email o teléfono requerido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleContinue = () => {
    if (!validate()) return;

    const fullOrderSnapshot = {
      items: cart,
      total,
      shipping: shippingInfo,
      paymentMethod: method,
      paymentDetails: method === 'card' ? {
        holderName: cardData.name,
        idType: cardData.idType,
        idNumber: cardData.idNumber,
        contact: cardData.contact
      } : null,
      date: new Date()
    };

    localStorage.setItem('last_payment_method', method);
    localStorage.setItem('lastOrder', JSON.stringify(fullOrderSnapshot));
    
    navigate('/checkout/summary', { state: fullOrderSnapshot });
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '50px', paddingBottom: '80px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '40px' }}>
        
        {/* Lado Izquierdo: Selección de Método */}
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '10px' }}>Método de Pago</h2>
          <p style={{ color: 'var(--muted-foreground)', marginBottom: '30px' }}>Selecciona cómo deseas abonar tu compra.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <PaymentOption 
              id="card" 
              title="Tarjeta de Crédito / Débito" 
              icon={<CreditCard size={24} />} 
              selected={method === 'card'} 
              onClick={() => setMethod('card')}
              desc="Visa, Mastercard, American Express"
            />
            <PaymentOption 
              id="transfer" 
              title="Transferencia Bancaria" 
              icon={<Landmark size={24} />} 
              selected={method === 'transfer'} 
              onClick={() => setMethod('transfer')}
              desc="Abona mediante CBU / Alias"
            />
            {isLocalPickup && (
              <PaymentOption 
                id="cash" 
                title="Efectivo en el Local" 
                icon={<Banknote size={24} />} 
                selected={method === 'cash'} 
                onClick={() => setMethod('cash')}
                desc="Abona al retirar en Zeballos 1315"
              />
            )}
          </div>

          {method === 'card' && (
            <div className="card animate-slide-up" style={{ marginTop: '30px', padding: '30px' }}>
               <h4 style={{ marginBottom: '20px' }}>Datos de la Tarjeta</h4>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Número de Tarjeta</label>
                    <input 
                      name="number"
                      className="input-field" 
                      placeholder="0000 0000 0000 0000" 
                      value={cardData.number}
                      onChange={handleInputChange}
                    />
                    {errors.number && <small style={{ color: 'red' }}>{errors.number}</small>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Nombre en Tarjeta</label>
                      <input 
                        name="name"
                        className="input-field" 
                        placeholder="JUAN PEREZ" 
                        value={cardData.name}
                        onChange={handleInputChange}
                      />
                      {errors.name && <small style={{ color: 'red' }}>{errors.name}</small>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Venc. (MM/YY)</label>
                      <input 
                        name="expiry"
                        className="input-field" 
                        placeholder="MM/YY" 
                        maxLength="5"
                        value={cardData.expiry}
                        onChange={handleInputChange}
                      />
                      {errors.expiry && <small style={{ color: 'red' }}>{errors.expiry}</small>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>CVV</label>
                      <input 
                        name="cvv"
                        className="input-field" 
                        placeholder="123" 
                        maxLength="4"
                        value={cardData.cvv}
                        onChange={handleInputChange}
                      />
                      {errors.cvv && <small style={{ color: 'red' }}>{errors.cvv}</small>}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Tipo ID</label>
                      <select name="idType" className="input-field" value={cardData.idType} onChange={handleInputChange}>
                        <option value="DNI">DNI</option>
                        <option value="CUIL">CUIL</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Nro. Identificación</label>
                      <input 
                        name="idNumber"
                        className="input-field" 
                        placeholder="Número de documento" 
                        value={cardData.idNumber}
                        onChange={handleInputChange}
                      />
                      {errors.idNumber && <small style={{ color: 'red' }}>{errors.idNumber}</small>}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Contacto (Email o Teléfono)</label>
                    <input 
                      name="contact"
                      className="input-field" 
                      placeholder="juan@ejemplo.com o 341..." 
                      value={cardData.contact}
                      onChange={handleInputChange}
                    />
                    {errors.contact && <small style={{ color: 'red' }}>{errors.contact}</small>}
                  </div>
               </div>
            </div>
          )}

          {method === 'transfer' && (
            <div className="card animate-slide-up" style={{ marginTop: '30px', padding: '30px', borderLeft: '4px solid var(--accent)' }}>
               <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                 <Landmark size={20} color="var(--accent)" /> Datos para la Transferencia
               </h4>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.95rem' }}>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>Banco</p>
                    <p style={{ fontWeight: 700, margin: 0 }}>Banco Ejemplo</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>Titular</p>
                    <p style={{ fontWeight: 700, margin: 0 }}>HH Company</p>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <p style={{ margin: '0 0 5px 0', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>CBU</p>
                    <p style={{ fontWeight: 700, margin: 0, letterSpacing: '1px' }}>0000003100000000000000</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>Alias</p>
                    <p style={{ fontWeight: 700, margin: 0 }}>HARDWARE.HAVEN</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>CUIT</p>
                    <p style={{ fontWeight: 700, margin: 0 }}>20-12345678-9</p>
                  </div>
               </div>
               <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'oklch(0.627 0.194 259.215 / 5%)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Info size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)', lineHeight: '1.4' }}>
                    Deberás adjuntar el comprobante en el siguiente paso para validar tu compra.
                  </p>
               </div>
            </div>
          )}

          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
             <ShieldCheck size={20} color="var(--success)" />
             Tus datos están protegidos con encriptación de grado bancario.
          </div>
        </div>

        {/* Lado Derecho: Resumen */}
        <div className="card" style={{ padding: '30px', height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '20px' }}>Resumen de Compra</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Subtotal ({cart.length} ítems)</span>
                <span>${subtotal.toLocaleString()}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Costo de Envío</span>
                <span style={{ color: shippingInfo.cost === 0 && shippingInfo.method !== 'standard' ? 'var(--success)' : 'inherit' }}>
                  {shippingInfo.method === 'tienda' ? 'Gratis' : `$${shippingInfo.cost.toLocaleString()}`}
                </span>
             </div>
             <div style={{ borderTop: '1px solid var(--border)', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
             </div>
          </div>

          <button 
            className="btn" 
            style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
            onClick={handleContinue}
          >
            Continuar al Resumen <ChevronRight size={18} />
          </button>
          
          <button 
            onClick={() => navigate('/envio')}
            style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted-foreground)', marginTop: '15px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Volver a envío
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentOption({ title, icon, selected, onClick, desc }) {
  return (
    <div 
      className="card" 
      onClick={onClick}
      style={{ 
        padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer',
        border: selected ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.2s'
      }}
    >
      <div style={{ color: selected ? 'var(--accent)' : 'var(--muted-foreground)' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>{desc}</div>
      </div>
      <div style={{ 
        width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--border)', 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        backgroundColor: selected ? 'var(--accent)' : 'transparent'
      }}>
        {selected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />}
      </div>
    </div>
  );
}
