import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Users, ShoppingBag, DollarSign, Activity, AlertTriangle, Calendar, Award, ChevronLeft, ChevronRight, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  
  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [loading, setLoading] = useState(true);

  // Purchase History State
  const [history, setHistory] = useState({ orders: [], totalPages: 1, currentPage: 1 });
  const [historyFilters, setHistoryFilters] = useState({ page: 1, shippingMethod: '' });
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    fetchPurchaseHistory();
  }, [historyFilters, startDate, endDate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get('http://localhost:5000/api/admin/dashboard-data', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setData(res.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    setLoadingHistory(true);
    try {
      const token = localStorage.getItem('token');
      const params = { ...historyFilters };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axios.get('http://localhost:5000/api/admin/purchase-history', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setHistory(res.data);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchDashboardData();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(fetchDashboardData, 100);
  };

  if (loading && !data) {
    return <div className="container" style={{ marginTop: '50px', textAlign: 'center' }}>Cargando inteligencia de negocio...</div>;
  }

  const { 
    stats, lowStockProducts, outOfStockProducts, topUsers, salesTrend, adminPerformance, 
    topProducts, shippingMethods, topSellingProducts, 
    productsByCategory, revenueByCategory, userRegistrations 
  } = data || {};

  // Formatear datos para gráficos
  const salesChartData = {
    labels: salesTrend?.map(t => new Date(t.date).toLocaleDateString('es-AR')) || [],
    datasets: [{
      label: 'Ingresos ($)',
      data: salesTrend?.map(t => t.total) || [],
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(56, 189, 248, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }]
  };

  const userRegChartData = {
    labels: userRegistrations?.map(u => new Date(u.date).toLocaleDateString('es-AR')) || [],
    datasets: [{
      label: 'Nuevos Usuarios',
      data: userRegistrations?.map(u => u.count) || [],
      borderColor: '#ec4899',
      backgroundColor: 'rgba(236, 72, 153, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.3
    }]
  };

  const adminChartData = {
    labels: adminPerformance?.map(a => a.admin_name) || [],
    datasets: [{
      label: 'Tickets Resueltos',
      data: adminPerformance?.map(a => a.resolved) || [],
      backgroundColor: '#10b981',
      borderRadius: 4,
    }]
  };

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

  const categoryStockChartData = {
    labels: productsByCategory?.map(c => c.category) || [],
    datasets: [{
      data: productsByCategory?.map(c => c.count) || [],
      backgroundColor: chartColors,
      borderWidth: 2,
      borderColor: 'var(--card)',
      hoverOffset: 15
    }]
  };

  const categoryRevenueChartData = {
    labels: revenueByCategory?.map(r => r.category) || [],
    datasets: [{
      data: revenueByCategory?.map(r => r.revenue) || [],
      backgroundColor: chartColors,
      borderWidth: 2,
      borderColor: 'var(--card)',
      hoverOffset: 15
    }]
  };

  const shippingChartData = {
    labels: shippingMethods?.map(s => s.method === 'tienda' ? 'Retiro en Tienda' : s.method.charAt(0).toUpperCase() + s.method.slice(1)) || [],
    datasets: [{
      data: shippingMethods?.map(s => s.count) || [],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
      borderWidth: 2,
      borderColor: 'var(--card)',
      hoverOffset: 15
    }]
  };

  const topSellingChartData = {
    labels: topSellingProducts?.map(p => p.name.substring(0, 15) + '...') || [],
    datasets: [{
      label: 'Unidades Vendidas',
      data: topSellingProducts?.map(p => p.totalQuantity) || [],
      backgroundColor: '#8b5cf6',
      borderRadius: 4,
    }]
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 }
        }
      }
    }
  };

  // Interactividad de clics en gráficos
  const onShippingClick = (event, elements) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      // Use the raw method name for filtering, not the display label
      const rawMethod = shippingMethods[idx].method;
      setHistoryFilters(prev => ({ ...prev, shippingMethod: rawMethod, page: 1 }));
      window.scrollTo({ top: document.getElementById('history-section').offsetTop - 50, behavior: 'smooth' });
    }
  };

  const onTicketClick = (event, elements) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const adminName = adminChartData.labels[idx];
      // Filter or show alert with admin details
      showAlert(`Tickets de ${adminName}`, `Este administrador ha resuelto ${adminPerformance[idx].resolved} tickets en el período seleccionado.`, 'info');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      
      {/* ALERTAS DE STOCK - REPOSICIÓN INMEDIATA */}
      {outOfStockProducts && outOfStockProducts.length > 0 && (
        <div style={{ backgroundColor: '#ef4444', color: 'white', padding: '15px 20px', borderRadius: 'var(--radius-lg)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <AlertTriangle size={24} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>URGENTE: Stock Agotado</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Hay {outOfStockProducts.length} producto(s) sin unidades disponibles. Reposición inmediata sugerida.
            </p>
          </div>
          <button className="btn" onClick={() => navigate('/admin/productos', { state: { filterOutOfStock: true } })} style={{ marginLeft: 'auto', backgroundColor: 'white', color: '#ef4444', border: 'none' }}>
            Ver Agotados
          </button>
        </div>
      )}

      {/* ALERTA DE STOCK BAJO - ADVERTENCIA */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div style={{ backgroundColor: '#f59e0b', color: 'white', padding: '15px 20px', borderRadius: 'var(--radius-lg)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <Activity size={24} />
          <div>
            <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Advertencia: Stock Bajo</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
              Hay {lowStockProducts.length} producto(s) en alerta (1-4 unidades).
            </p>
          </div>
          <button className="btn" onClick={() => navigate('/admin/productos', { state: { filterLowStock: true } })} style={{ marginLeft: 'auto', backgroundColor: 'white', color: '#f59e0b', border: 'none' }}>
            Filtrar Alerta
          </button>
        </div>
      )}

      {/* HEADER & FILTROS GLOBALES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>Dashboard Analítico</h2>
          <p style={{ color: 'var(--muted-foreground)' }}>Reportes Históricos y Métricas de Rendimiento</p>
        </div>
        
        <form onSubmit={handleFilter} className="card" style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', padding: '15px', border: '1px solid var(--border)' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Desde</label>
            <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ borderColor: 'var(--border)' }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', display: 'block', marginBottom: '5px' }}>Hasta</label>
            <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ borderColor: 'var(--border)' }} />
          </div>
          <button type="submit" className="btn" style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={18}/> Filtrar
          </button>
          {(startDate || endDate) && (
            <button type="button" className="btn btn-outline" onClick={handleClearFilter} style={{ height: '42px' }}>
              Limpiar
            </button>
          )}
        </form>
      </div>
      
      {/* TARJETAS DE MÉTRICAS - FILA 1 (HISTÓRICO / TOTAL) y FILA 2 (FILTRADO / PERIODO) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* FILA 1: DESDE EL INICIO / AL DÍA DE HOY */}
        <StatCard title="Ingresos Históricos" subtitle="Desde el inicio" value={`$${Number(stats?.revenue || 0).toLocaleString('es-AR')}`} icon={<DollarSign size={24} />} bg="rgba(16, 185, 129, 0.1)" color="#10b981" />
        <StatCard title="Órdenes Totales" subtitle="Desde el inicio" value={stats?.totalOrders || 0} icon={<ShoppingBag size={24} />} bg="rgba(56, 189, 248, 0.1)" color="#38bdf8" />
        <StatCard title="Total Usuarios" subtitle="Al día de hoy" value={stats?.totalUsers || 0} icon={<Users size={24} />} bg="rgba(139, 92, 246, 0.1)" color="#8b5cf6" />
        <StatCard title="Total Productos" subtitle="Al día de hoy" value={stats?.totalProducts || 0} icon={<Activity size={24} />} bg="rgba(245, 158, 11, 0.1)" color="#f59e0b" />
        
        {/* FILA 2: DEL PERIODO FILTRADO */}
        <StatCard title="Ingresos Periodo" subtitle="Del periodo filtrado" value={`$${Number(stats?.periodRevenue || 0).toLocaleString('es-AR')}`} icon={<DollarSign size={24} />} bg="rgba(16, 185, 129, 0.1)" color="#10b981" />
        <StatCard title="Órdenes Periodo" subtitle="Del periodo filtrado" value={stats?.periodOrders || 0} icon={<ShoppingBag size={24} />} bg="rgba(56, 189, 248, 0.1)" color="#38bdf8" />
        <StatCard title="Nuevos Usuarios" subtitle="Del periodo filtrado" value={stats?.newUsers || 0} icon={<Plus size={24} />} bg="rgba(236, 72, 153, 0.1)" color="#ec4899" />
        <StatCard title="Nuevos Productos" subtitle="Del periodo filtrado" value={stats?.newProducts || 0} icon={<Plus size={24} />} bg="rgba(6, 182, 212, 0.1)" color="#06b6d4" />
      </div>

      {/* TENDENCIAS PRINCIPALES - FILA 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px', marginBottom: '30px', alignItems: 'stretch' }}>
        
        {/* GRÁFICO TENDENCIA DE VENTAS */}
        <div className="card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Evolución de Ingresos</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Filtrado por fechas</span>
          </div>
          {salesTrend && salesTrend.length > 0 ? (
             <div style={{ height: '300px' }}>
               <Line 
                 options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} 
                 data={salesChartData} 
               />
             </div>
          ) : (
             <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>No hay ventas en este período</div>
          )}
        </div>

        {/* TENDENCIA DE REGISTROS */}
        <div className="card" style={{ padding: '30px' }}>
          <h4 style={{ marginBottom: '20px', fontSize: '1.2rem', fontWeight: 700 }}>Crecimiento de Usuarios</h4>
          <div style={{ height: '300px' }}>
            <Line 
              data={userRegChartData} 
              options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} 
            />
          </div>
        </div>
      </div>

      {/* ANALÍTICA DE CATEGORÍAS Y ENVÍOS - FILA 3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '30px' }}>
        
        <div className="card" style={{ padding: '25px' }}>
          <h5 style={{ marginBottom: '20px', fontSize: '1.1rem', textAlign: 'center' }}>Stock por Categoría</h5>
          <div style={{ height: '320px' }}>
            <Bar 
              data={categoryStockChartData} 
              options={{ 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, grid: { display: false } } }
              }} 
            />
          </div>
        </div>

        <div className="card" style={{ padding: '25px' }}>
          <h5 style={{ marginBottom: '20px', fontSize: '1.1rem', textAlign: 'center' }}>Ventas por Categoría</h5>
          <div style={{ height: '320px' }}>
            <Bar 
              data={categoryRevenueChartData} 
              options={{ 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, grid: { display: false } } }
              }} 
            />
          </div>
        </div>

        <div className="card" style={{ padding: '25px' }}>
          <h5 style={{ marginBottom: '20px', fontSize: '1.1rem', textAlign: 'center' }}>Métodos de Envío</h5>
          <div style={{ height: '260px' }}>
            <Doughnut data={shippingChartData} options={{ ...doughnutOptions, onClick: onShippingClick }} />
          </div>
        </div>
      </div>

      {/* RENDIMIENTO Y RANKINGS - FILA 4 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.2fr', gap: '30px', marginBottom: '40px', alignItems: 'start' }}>
        
        {/* TOP PRODUCTOS (VENTAS) */}
        <div className="card" style={{ padding: '25px' }}>
          <h4 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 700 }}>Más Vendidos</h4>
          <div style={{ height: '350px' }}>
            {topSellingProducts && topSellingProducts.length > 0 ? (
              <Bar 
                options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} 
                data={topSellingChartData} 
              />
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted-foreground)' }}>Sin ventas</div>
            )}
          </div>
        </div>

        {/* RENDIMIENTO ADMINS */}
        <div className="card" style={{ padding: '25px' }}>
          <h4 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 700 }}>Soporte (Admins)</h4>
          <div style={{ height: '350px' }}>
            <Bar 
              data={adminChartData} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                onClick: onTicketClick
              }} 
            />
          </div>
        </div>

        {/* MEJORES CLIENTES */}
        <div className="card" style={{ padding: '25px' }}>
          <h4 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={20} color="#f59e0b" /> Top Clientes
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(topUsers || []).length > 0 ? topUsers.map((u, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{u.name.split(' ')[0]}</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{u.orderCount} compras</p>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                  ${Number(u.totalSpent).toLocaleString('es-AR')}
                </div>
              </div>
            )) : <p style={{ color: 'var(--muted-foreground)' }}>Sin datos.</p>}
          </div>
          
          <h4 style={{ marginTop: '25px', marginBottom: '15px', fontSize: '1.1rem', fontWeight: 700 }}>Más Vistos (Web)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(topProducts || []).slice(0, 3).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{p.name}</span>
                <span style={{ fontWeight: 600 }}>{p.views} views</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* HISTORIAL DE TICKETS - SEGUIMIENTO DE ADMINS */}
      <section className="card" style={{ padding: '30px', marginBottom: '30px' }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px' }}>Seguimiento de Tickets (Soporte)</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px', alignItems: 'start' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Resolución por Administrador</h4>
            <div style={{ height: '300px' }}>
              <Bar 
                data={adminChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }} 
              />
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '15px' }}>Actividad Detallada</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)' }}>Administrador</th>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)', textAlign: 'center' }}>Tickets Resueltos</th>
                </tr>
              </thead>
              <tbody>
                {adminPerformance?.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{a.admin_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{a.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* HISTORIAL DE COMPRAS */}
      <section id="history-section" className="card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Historial de Compras</h3>
          
          <div style={{ display: 'flex', gap: '15px' }}>
             <select className="input-field" value={historyFilters.shippingMethod} onChange={e => setHistoryFilters(p => ({...p, shippingMethod: e.target.value, page: 1}))}>
               <option value="">Cualquier Envío</option>
               <option value="express">Express</option>
               <option value="normal">Normal</option>
               <option value="tienda">Retiro en Tienda</option>
             </select>
             {(historyFilters.shippingMethod) && (
               <button className="btn btn-outline" onClick={() => setHistoryFilters({ page: 1, shippingMethod: '' })}>Limpiar</button>
             )}
          </div>
        </div>

        {loadingHistory ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Cargando historial...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)' }}>ID Orden</th>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)' }}>Fecha</th>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)' }}>Cliente</th>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)' }}>Envío</th>
                  <th style={{ padding: '12px', color: 'var(--muted-foreground)' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {history.orders.length > 0 ? history.orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>#{o.id}</td>
                    <td style={{ padding: '12px' }}>{new Date(o.fecha_compra).toLocaleDateString('es-AR')}</td>
                    <td style={{ padding: '12px' }}>{o.User?.name} <br/><span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{o.User?.email}</span></td>
                    <td style={{ padding: '12px', textTransform: 'capitalize' }}>{o.shipping_method === 'tienda' ? 'Retiro en Tienda' : o.shipping_method}</td>
                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--primary)' }}>${Number(o.total).toLocaleString('es-AR')}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: 'var(--muted-foreground)' }}>No se encontraron órdenes con estos filtros.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {history.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button 
              className="btn btn-outline" 
              disabled={history.currentPage === 1}
              onClick={() => setHistoryFilters(p => ({ ...p, page: p.page - 1 }))}
            ><ChevronLeft size={18} /></button>
            <span style={{ padding: '8px 12px', fontWeight: 600 }}>{history.currentPage} de {history.totalPages}</span>
            <button 
              className="btn btn-outline" 
              disabled={history.currentPage === history.totalPages}
              onClick={() => setHistoryFilters(p => ({ ...p, page: p.page + 1 }))}
            ><ChevronRight size={18} /></button>
          </div>
        )}
      </section>

    </div>
  );
}

function StatCard({ title, subtitle, value, icon, bg, color }) {
  return (
    <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s', cursor: 'default' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ backgroundColor: bg, color: color, padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {icon}
      </div>
      <div>
        <h4 style={{ color: 'var(--muted-foreground)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
        {subtitle && <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', margin: '0 0 4px 0', opacity: 0.8 }}>{subtitle}</p>}
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--foreground)' }}>{value}</span>
      </div>
    </div>
  );
}
