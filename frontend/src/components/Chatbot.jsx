import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send, ShoppingCart, AlertCircle } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'text', message: '¡Hola! Soy la IA de Hardware Haven. ¿Qué buscas armar hoy?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastProducts, setLastProducts] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isOpen]);

  const sendMessage = async (e, overrideMessage = null) => {
    if (e) e.preventDefault();
    const finalMessage = overrideMessage || input;
    if (!finalMessage.trim() || isTyping) return;

    // Si es un mensaje del usuario normal (o override visible)
    const userMsg = { type: 'text', message: finalMessage, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');

      const payload = {
        message: finalMessage,
        history: messages,
        lastProducts: lastProducts,
        cartItems: cartItems
      };

      const res = await axios.post('http://localhost:5000/api/chatbot/message', payload);

      const botResponse = {
        type: res.data.type || 'text',
        message: res.data.message || '',
        products: Array.isArray(res.data.products) ? res.data.products : [],
        action: res.data.action || null,
        sender: 'bot'
      };

      if (botResponse.products && botResponse.products.length > 0) {
        setLastProducts(botResponse.products);
      }

      // Sincronizar acción de carrito
      if (botResponse.type === 'cart_action' && botResponse.action?.productId) {
        let addedProd = null;
        if (botResponse.action.product) addedProd = botResponse.action.product;
        else if (lastProducts && lastProducts.length > 0) {
          addedProd = lastProducts.find(p => p.id === botResponse.action.productId) || lastProducts[0];
        }

        if (addedProd) {
          const cart = JSON.parse(localStorage.getItem('cart') || '[]');
          cart.push(addedProd);
          localStorage.setItem('cart', JSON.stringify(cart));
          window.dispatchEvent(new Event('storage'));
        }
      }

      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error('[Chatbot] Axios error:', err);
      setMessages(prev => [...prev, { type: 'text', message: 'Lo siento, tuve un error consultando mi base de conocimientos o hubo un fallo en la red.', sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Llamada directa al endpoint de carrito desde el botón Agregar
  const addToCart = async (productId) => {
    try {
      // Optimísticamente añadir mensaje del usuario
      const userMsg = { type: 'text', message: `Agregar producto ${productId}`, sender: 'user' };
      setMessages(prev => [...prev, userMsg]);

      const res = await axios.post('http://localhost:5000/api/cart/add', { productId });
      if (res.data && res.data.ok && res.data.product) {
        const botResponse = {
          type: 'cart_action',
          message: `Producto agregado al carrito exitosamente.`,
          products: [],
          action: { type: "add_to_cart", productId: res.data.product.id, product: res.data.product },
          sender: 'bot'
        };

        // Actualizar carrito local
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart.push(res.data.product);
        localStorage.setItem('cart', JSON.stringify(cart));
        window.dispatchEvent(new Event('storage'));

        setMessages(prev => [...prev, botResponse]);
      } else {
        setMessages(prev => [...prev, { type: 'text', message: res.data.error || 'No se pudo agregar el producto', sender: 'bot' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { type: 'text', message: 'Error al agregar el producto al carrito.', sender: 'bot' }]);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent) 0%, oklch(0.205 0 0) 100%)',
          color: 'white',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.2)',
          display: isOpen ? 'none' : 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}
      >
        <MessageSquare size={30} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '400px', height: '600px',
          backgroundColor: 'var(--card)', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', zIndex: 100,
          border: '1px solid var(--border)'
        }}>
          {/* Header */}
          <div style={{ padding: '15px 20px', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Asesor Inteligente</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--primary-foreground)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>

                {/* Text or Action Message Render */}
                {(msg.type === 'text' || msg.type === 'cart_action' || !msg.type) && msg.message && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 'var(--radius-md)',
                    backgroundColor: msg.type === 'cart_action' ? 'var(--input)' : (msg.sender === 'user' ? 'var(--accent)' : 'var(--muted)'),
                    color: msg.sender === 'user' ? 'var(--accent-foreground)' : 'var(--foreground)',
                    border: msg.type === 'cart_action' ? '1px solid var(--border)' : 'none',
                    fontSize: '0.95rem', lineHeight: '1.4',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {msg.message || msg.text}
                  </div>
                )}

                {/* Products Message Render (also triggered for recommendations under cart_action) */}
                {(msg.type === 'products' || msg.type === 'cart_action') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: msg.type === 'cart_action' ? '10px' : '0' }}>

                    {msg.type === 'products' && msg.message && (
                      <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--muted)', color: 'var(--foreground)', fontSize: '0.95rem', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </div>
                    )}

                    {/* Array robust checking and map execution */}
                    {Array.isArray(msg.products) && msg.products.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                        {msg.type === 'cart_action' && (
                          <div style={{ fontSize: '0.9rem', marginBottom: '-5px', fontWeight: 600, color: 'var(--accent)' }}>Productos Recomendados:</div>
                        )}
                        {msg.products.map((prod, prodIdx) => (
                          <div key={prod.id || prodIdx + 999} style={{
                            display: 'flex', flexDirection: 'column', gap: '8px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px'
                          }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <img
                                src={prod.imgURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiB2aWV3Qm94PSIwIDAgMzAwIDMwMCI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmOGZhZmMiLz48dGV4dCB4PSIxNTAiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhhcmR3YXJlPC90ZXh0Pjwvc3ZnPg=='}
                                alt={prod.name || 'Producto'}
                                style={{ width: '50px', height: '50px', objectFit: 'contain', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-sm)' }}
                              />
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{prodIdx + 1}. {prod.name || 'Producto Sin Nombre'}</h4>
                                <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>${Number(prod.price || 0).toLocaleString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => addToCart(prod.id)}
                              style={{
                                marginTop: '5px', width: '100%', padding: '8px',
                                backgroundColor: 'var(--accent)', color: 'white',
                                border: 'none', borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px'
                              }}
                            >
                              <ShoppingCart size={14} /> Agregar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fallback vacio defensivo */}
                    {msg.type === 'products' && (!Array.isArray(msg.products) || msg.products.length === 0) && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontSize: '0.9rem' }}>No hay modelos disponibles por el momento con este término, pero el equipo está recargando stock.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                La IA está pensando...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={(e) => sendMessage(e)} style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Ej: Necesito una gráfica para 4K..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', outline: 'none', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            />
            <button type="submit" style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Send size={20} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
