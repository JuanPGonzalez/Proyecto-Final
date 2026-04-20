import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, X, Send } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: '¡Hola! Soy la IA de Hardware Haven. ¿Qué buscas armar hoy?', sender: 'bot' }]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    try {
      const res = await axios.post('http://localhost:5000/api/chatbot', { message: input });
      setMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Lo siento, tuve un error consultando la base de datos.', sender: 'bot' }]);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed', bottom: '30px', right: '30px',
          width: '60px', height: '60px', borderRadius: '50%',
          backgroundColor: 'var(--accent)', color: 'white',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)',
          display: isOpen ? 'none' : 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 100
        }}
      >
        <MessageSquare size={30} />
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px',
          width: '400px', height: '600px', // Ventana mucho más grande solicitada
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
                <div style={{
                  padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.sender === 'user' ? 'var(--accent)' : 'var(--muted)',
                  color: msg.sender === 'user' ? 'white' : 'var(--foreground)',
                  fontSize: '0.95rem', lineHeight: '1.4'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} style={{ padding: '15px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px' }}>
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
