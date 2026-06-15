import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, ShoppingCart, AlertCircle, Eye, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Chatbot({ standalone = false }) {
  const [isOpen, setIsOpen] = useState(standalone);
  const [messages, setMessages] = useState([
    { type: 'text', message: '¡Hola! Soy el asistente de Hardware Haven. ¿En qué puedo ayudarte?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastProducts, setLastProducts] = useState([]);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isOpen]);

  useEffect(() => {
    if (standalone || location.pathname === '/chatbot') {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [standalone, location.pathname]);

  const toggleChat = () => {
    if (standalone || location.pathname === '/chatbot') return;
    navigate('/chatbot');
  };

  const sendMessage = async (e, overrideMessage = null, extraParams = {}) => {
    if (e) e.preventDefault();
    const finalMessage = overrideMessage || input;
    if (!finalMessage.trim() && !extraParams.intent) return;

    if (finalMessage.trim()) {
      const userMsg = { type: 'text', message: finalMessage, sender: 'user' };
      setMessages(prev => [...prev, userMsg]);
    }
    
    setInput('');
    setIsTyping(true);

    try {
      // Get current cart for compatibility logic
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

      const payload = {
        message: finalMessage,
        lastProducts: lastProducts,
        cartItems: cartItems, // SEND CART ITEMS
        ...extraParams
      };

      const res = await axios.post('http://localhost:5000/api/chatbot/message', payload);

      const botResponse = {
        ...res.data,
        sender: 'bot'
      };

      if (botResponse.products) setLastProducts(botResponse.products);

      // Handle Redirects
      if (botResponse.type === 'redirect' && res.data.url) {
        setMessages(prev => [...prev, botResponse]);
        setTimeout(() => navigate(res.data.url), 2000);
        return;
      }

      // Handle Cart Update (with recommendations)
      if (botResponse.type === 'cart_update' && extraParams.productId) {
        // Find product in local state or lastProducts
        const addedProd = lastProducts.find(p => p.id === extraParams.productId);
        if (addedProd) {
          // Validar stock antes de agregar
          if (Number(addedProd.stock) <= 0) {
            setMessages(prev => [...prev, { type: 'text', message: `❌ Lo siento, **${addedProd.name}** no tiene stock disponible en este momento.`, sender: 'bot' }]);
            setIsTyping(false);
            return;
          }

          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          const existing = cart.find(i => i.id === addedProd.id);
          if (existing) {
            if ((existing.quantity || 1) >= Number(addedProd.stock)) {
              setMessages(prev => [...prev, { type: 'text', message: `⚠️ Ya tienes el máximo disponible de **${addedProd.name}** en tu carrito (stock: ${addedProd.stock}).`, sender: 'bot' }]);
              setIsTyping(false);
              return;
            }
            existing.quantity = (existing.quantity || 1) + 1;
          } else {
            cart.push({ ...addedProd, quantity: 1 });
          }
          localStorage.setItem('cart', JSON.stringify(cart));
          window.dispatchEvent(new Event('storage'));
        }
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error('[Chatbot] Axios error:', err);
      setMessages(prev => [...prev, { type: 'text', message: 'Lo siento, tuve un error técnico.', sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const requestProductDetail = (product) => {
    sendMessage(null, `Ver detalle de ${product.name}`, { intent: 'view_detail', productId: product.id });
  };

  const addToCart = (product) => {
    sendMessage(null, `Agregar ${product.name} al carrito`, { intent: 'add_to_cart', productId: product.id });
  };

  const isPageMode = standalone || location.pathname === '/chatbot';
  
  if (!standalone && location.pathname === '/chatbot') return null;

  return (
    <>
      {!isPageMode && !isOpen && (
        <button onClick={toggleChat} style={{ position: 'fixed', bottom: '30px', right: '30px', width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, oklch(0.205 0 0) 100%)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <MessageSquare size={30} />
        </button>
      )}

      {(isOpen || isPageMode) && (
        <div className={isPageMode ? "container" : ""} style={isPageMode ? { padding: '0 20px' } : {}}>
          {isPageMode && (
            <div style={{ marginTop: '40px', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Asesor Inteligente</h2>
              <p style={{ color: 'var(--muted-foreground)' }}>Consultá sobre componentes y complementos para tu PC.</p>
            </div>
          )}
          
          <div style={{
            width: isPageMode ? '100%' : '400px',
            height: isPageMode ? 'calc(100vh - 250px)' : 'calc(100vh - 100px)',
            maxHeight: isPageMode ? 'none' : '700px',
            maxWidth: isPageMode ? '900px' : 'none',
            margin: isPageMode ? '20px auto' : '0',
            position: isPageMode ? 'relative' : 'fixed',
            bottom: isPageMode ? 'auto' : '20px',
            right: isPageMode ? 'auto' : '20px',
            backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', zIndex: 100,
            border: '1px solid var(--border)', overflow: 'hidden'
          }}>
            <div style={{ padding: '15px 20px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Soporte Hardware Haven</h3>
              {!isPageMode && <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>}
            </div>

            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', backgroundColor: 'var(--background)' }}>
              {messages.map((msg, idx) => (
                <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  
                  {/* TEXT & REDIRECT */}
                  {(msg.type === 'text' || msg.type === 'redirect' || !msg.type) && msg.message && (
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: msg.sender === 'user' ? 'var(--accent)' : 'var(--muted)', color: msg.sender === 'user' ? 'var(--accent-foreground)' : 'var(--foreground)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: msg.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}>
                    </div>
                  )}

                  {/* PRODUCT LIST */}
                  {msg.type === 'products' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--muted)', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: msg.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                      <div style={{ display: 'grid', gridTemplateColumns: isPageMode ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr', gap: '10px' }}>
                        {msg.products?.map(p => (
                          <div key={p.id} style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                              <img src={p.imgURL} style={{ width: '40px', height: '40px', objectFit: 'contain' }} alt={p.name} />
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>{p.name}</h4>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 800 }}>${Number(p.price).toLocaleString()}</p>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button onClick={() => addToCart(p)} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                <ShoppingCart size={12} /> Comprar
                              </button>
                              <button onClick={() => requestProductDetail(p)} style={{ flex: 1, padding: '6px', fontSize: '0.7rem', backgroundColor: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                                <Eye size={12} /> Detalle
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRODUCT DETAIL VIEW */}
                  {msg.type === 'product_detail' && msg.product && (
                    <div className="card" style={{ padding: '15px', maxWidth: '300px', border: '1px solid var(--primary)' }}>
                       <img src={msg.product.imgURL} style={{ width: '100%', height: '120px', objectFit: 'contain', marginBottom: '10px' }} alt="" />
                       <h4 style={{ margin: '0 0 5px 0', fontSize: '1rem', fontWeight: 800 }}>{msg.product.name}</h4>
                       <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 900 }}>${Number(msg.product.price).toLocaleString()}</p>
                       <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: '15px', lineHeight: '1.4' }}>{msg.product.description}</p>
                       <button onClick={() => addToCart(msg.product)} style={{ width: '100%', padding: '10px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                         <ShoppingCart size={16} /> Sumar al Carrito
                       </button>
                    </div>
                  )}

                  {/* CART UPDATE + RECOMMENDATIONS */}
                  {msg.type === 'cart_update' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--success-muted || var(--muted))', border: '1px solid var(--success)', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: msg.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></div>
                      
                      {msg.relatedProducts?.length > 0 && (
                        <div style={{ backgroundColor: 'var(--secondary)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary)' }}>
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Complementa tu compra 👇</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                             {msg.relatedProducts.map(rp => (
                               <div key={rp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--card)', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>{rp.name}</span>
                                  <button onClick={() => requestProductDetail(rp)} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}><ChevronRight size={16}/></button>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
              {isTyping && <div style={{ alignSelf: 'flex-start', padding: '10px', color: 'var(--muted-foreground)', fontSize: '0.8rem' }}>Escribiendo...</div>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', backgroundColor: 'var(--card)' }}>
              <input type="text" placeholder="¿Qué estás buscando?" value={input} onChange={(e) => setInput(e.target.value)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none', backgroundColor: 'var(--background)' }} />
              <button type="submit" style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Send size={20} /></button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
