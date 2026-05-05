import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import AdminProducts from './pages/AdminProducts';
import AdminTickets from './pages/AdminTickets';
import AdminOrders from './pages/AdminOrders';
import AdminUsers from './pages/AdminUsers';
import AdminStockManager from './pages/AdminStockManager';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import Ayuda from './pages/Ayuda';
import Presupuestador from './pages/Presupuestador';
import Envios from './pages/Envios';
import CompraExitosa from './pages/CompraExitosa';
import CancelPurchase from './pages/CancelPurchase';
import SoporteTickets from './pages/SoporteTickets';
import About from './pages/About';
import Terms from './pages/Terms';
import Forbidden from './pages/Forbidden';
import Payment from './pages/Payment';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <Router>
      <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <main style={{ flex: 1, position: 'relative', paddingBottom: '40px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login initialMode="register" />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/ayuda" element={<Ayuda />} />
            <Route path="/presupuestador" element={<Presupuestador />} />
            <Route path="/envio" element={<Envios />} />
            <Route path="/pago" element={<Payment />} />
            <Route path="/checkout/summary" element={<CompraExitosa />} />
            <Route path="/success" element={<CompraExitosa />} />
            <Route path="/cancel-purchase" element={<CancelPurchase />} />
            <Route path="/soporte" element={<SoporteTickets />} />
            <Route path="/about" element={<About />} />
            <Route path="/terms" element={<Terms />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/productos" element={<AdminProducts />} />
            <Route path="/admin/reclamos" element={<AdminTickets />} />
            <Route path="/admin/pedidos" element={<AdminOrders />} />
            <Route path="/admin/usuarios" element={<AdminUsers />} />
            <Route path="/admin/stock" element={<AdminStockManager />} />
            
            <Route path="/chatbot" element={<Chatbot standalone={true} />} />

            {/* Error handling */}
            <Route path="/forbidden" element={<Forbidden />} />
            <Route path="*" element={<Forbidden />} />
          </Routes>
        </main>
        
        {/* Footer Minimalista */}
        <footer style={{ backgroundColor: 'var(--card)', padding: '30px 0', borderTop: '1px solid var(--border)', textAlign: 'center', marginTop: 'auto' }}>
           <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '15px' }}>
              <a href="/about" style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Acerca de</a>
              <a href="/terms" style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Términos y Privacidad</a>
              <a href="/ayuda" style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>Ayuda</a>
           </div>
           <p style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem' }}>&copy; 2026 Hardware Haven (Proyecto Universitario UTN).</p>
        </footer>

        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
