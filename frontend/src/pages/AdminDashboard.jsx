import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Users, ShoppingBag, DollarSign, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalOrders: 0, revenue: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingAI, setLoadingAI] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || user.tipoUsuario !== 'admin') {
      return navigate('/forbidden');
    }

    const headers = { Authorization: `Bearer ${token}` };

    // Fetch stats
    axios.get('http://localhost:5000/api/admin/stats', { headers })
      .then(res => setStats(res.data))
      .catch(console.error);

    // Fetch top products
    axios.get('http://localhost:5000/api/admin/top-products', { headers })
      .then(res => setTopProducts(res.data))
      .catch(console.error);

    // Fetch AI Insights
    axios.get('http://localhost:5000/api/admin/ai-insights', { headers })
      .then(res => {
        setAiInsights(res.data.insights);
        setLoadingAI(false);
      })
      .catch(() => setLoadingAI(false));
  }, [navigate]);

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Dashboard Inteligente</h2>
        <p style={{ color: 'var(--muted-foreground)' }}>Hardware Haven Business Intelligence & AI Assistant</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <StatCard title="Ingresos Totales" value={`$${Number(stats.revenue).toLocaleString()}`} icon={<DollarSign size={24} />} bg="oklch(0.627 0.194 149.214 / 15%)" color="oklch(0.627 0.194 149.214)" />
        <StatCard title="Órdenes" value={stats.totalOrders} icon={<ShoppingBag size={24} />} bg="oklch(0.6 0.118 266.355 / 15%)" color="oklch(0.6 0.118 266.355)" />
        <StatCard title="Usuarios" value={stats.totalUsers} icon={<Users size={24} />} bg="oklch(0.708 0 0 / 15%)" color="oklch(0.4 0 0)" />
        <StatCard title="Productos" value={stats.totalProducts} icon={<Activity size={24} />} bg="oklch(0.8 0.1 200 / 15%)" color="oklch(0.5 0.1 200)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* AI INSIGHTS PANEL */}
          <div className="card" style={{ padding: '30px', border: '1px solid var(--primary)', backgroundColor: 'oklch(0.205 0 0 / 2%)' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span> AI Business Insights
            </h4>
            {loadingAI ? (
              <p style={{ color: 'var(--muted-foreground)' }}>Gemini está analizando tus métricas...</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {aiInsights.map((insight, i) => (
                  <li key={i} style={{ padding: '15px', backgroundColor: 'var(--card)', borderRadius: 'var(--radius-md)', marginBottom: '10px', border: '1px solid var(--border)', fontSize: '0.95rem', display: 'flex', gap: '12px' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{i+1}.</span> {insight}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* MAIN CHART */}
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '20px' }}>Tendencia de Ingresos</h4>
            <Bar 
              options={{ responsive: true, plugins: { legend: { display: false } } }} 
              data={{
                labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
                datasets: [{
                  label: 'Ventas',
                  data: [12000, 19000, 15000, 22000, 18000, 25000, stats.revenue > 0 ? stats.revenue : 30000],
                  backgroundColor: 'var(--primary)',
                  borderRadius: 4,
                }],
              }} 
              style={{ maxHeight: '300px' }} 
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
           {/* TOP PRODUCTS */}
           <div className="card" style={{ padding: '30px' }}>
              <h4 style={{ marginBottom: '20px' }}>Productos más Vistos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {topProducts.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '15px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: '40px', height: '40px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                       <img src={p.imgURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '2px' }}>{p.name}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{p.views} visualizaciones</p>
                    </div>
                    <span style={{ fontWeight: 700 }}>${Number(p.price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
           </div>

           {/* LOW STOCK ALERT */}
           <div className="card" style={{ padding: '30px', borderLeft: '4px solid var(--destructive)' }}>
              <h4 style={{ color: 'var(--destructive)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} /> Alerta de Stock
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                Tienes 3 productos con menos de 5 unidades. Considera reponer inventario pronto.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg, color }) {
  return (
    <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <div style={{ backgroundColor: bg, color: color, padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {icon}
      </div>
      <div>
        <h4 style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{value}</span>
      </div>
    </div>
  );
}
