import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import { Users, ShoppingBag, DollarSign, Activity, AlertTriangle, Calendar, Award, ChevronLeft, ChevronRight, Search, Globe, History, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';
import { showToast } from '../utils/swal';
import ClientDetailModal from '../components/ClientDetailModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [compare, setCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // Para el filtro de historial
  
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  // Período Principal
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  // Período de Comparación
  const [compareStart, setCompareStart] = useState('');
  const [compareEnd, setCompareEnd] = useState('');

  const [history, setHistory] = useState({ orders: [], totalPages: 1, currentPage: 1 });
  const [historyFilters, setHistoryFilters] = useState({ page: 1, shippingType: 'all', clientId: 'all' });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchDashboardData();
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    fetchPurchaseHistory();
  }, [historyFilters]);

  const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
    if (!aStart || !aEnd || !bStart || !bEnd) return false;
    return new Date(bStart) <= new Date(aEnd) && new Date(bEnd) >= new Date(aStart);
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = { compare };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      if (compare && compareStart && compareEnd) {
        params.compareStart = compareStart;
        params.compareEnd = compareEnd;
      }

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

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
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
      setHistory(res.data || { orders: [], totalPages: 1, currentPage: 1 });
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFilter = (e) => {
    if (e) e.preventDefault();
    
    if (!startDate || !endDate) {
      showToast('Selecciona el rango de fechas principal.', 'info');
      return;
    }

    if (compare) {
      if (!compareStart || !compareEnd) {
        showToast('Completa las fechas de comparación.', 'info');
        return;
      }
      if (new Date(compareStart) >= new Date(compareEnd)) {
        showToast('La fecha de inicio de comparación debe ser anterior a la de fin.', 'warning');
        return;
      }
      if (rangesOverlap(startDate, endDate, compareStart, compareEnd)) {
        showToast('El período comparativo no puede solaparse con el principal.', 'warning');
        return;
      }
    }

    fetchDashboardData();
  };

  const handleClearFilter = () => {
    setStartDate(firstDay);
    setEndDate(lastDay);
    setCompareStart('');
    setCompareEnd('');
    setCompare(false);
    setTimeout(fetchDashboardData, 100);
  };

  if (loading && !data) {
    return <div className="container" style={{ marginTop: '50px', textAlign: 'center' }}>Cargando inteligencia de negocio...</div>;
  }

  if (!data) {
    return <div className="container" style={{ marginTop: '50px', textAlign: 'center' }}>No se pudo cargar la información analítica.</div>;
  }

  const global = data.global || data.stats || {};
  const current = data.current || data.stats || {};
  const previous = data.previous || null;
  const rankings = data.rankings || {
    lowStockProducts: data.lowStockProducts || [],
    outOfStockProducts: data.outOfStockProducts || [],
    topUsers: data.topUsers || [],
    productsByCategory: data.productsByCategory || [],
    shippingMethods: data.shippingMethods || [],
    topSellingProducts: data.topSellingProducts || [],
    topProducts: data.topProducts || []
  };

  const salesChartData = {
    labels: current?.salesTrend?.map(t => t.date ? new Date(t.date).toLocaleDateString('es-AR') : '') || [],
    datasets: [
      {
        label: 'Periodo actual',
        data: current?.salesTrend?.map(t => t.total || 0) || [],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      },
      compare && previous?.salesTrend ? {
        label: 'Periodo anterior',
        data: previous.salesTrend.map(t => t.total || 0) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.2)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: true,
        tension: 0.3,
        pointRadius: 0
      } : null
    ].filter(Boolean)
  };

  const userGrowthData = {
    labels: current?.userRegistrations?.map(u => u.date ? new Date(u.date).toLocaleDateString('es-AR') : '') || [],
    datasets: [
      {
        label: 'Periodo actual',
        data: current?.userRegistrations?.map(u => u.count || 0) || [],
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3
      },
      compare && previous?.userRegistrations ? {
        label: 'Periodo anterior',
        data: previous.userRegistrations.map(u => u.count || 0) || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: true,
        tension: 0.3,
        pointRadius: 0
      } : null
    ].filter(Boolean)
  };

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#71717a'];

  const categoryStockData = {
    labels: rankings?.productsByCategory?.map(c => c.category || 'Sin Cat.') || [],
    datasets: [{
      data: rankings?.productsByCategory?.map(c => c.count || 0) || [],
      backgroundColor: chartColors,
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  const shippingData = {
    labels: rankings?.shippingMethods?.map(s => s.method === 'tienda' ? 'Retiro en Tienda' : (s.method?.toUpperCase() || 'OTRO')) || [],
    datasets: [{
      data: rankings?.shippingMethods?.map(s => s.count || 0) || [],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
      borderWidth: 0
    }]
  };

  const topSellingData = {
    labels: rankings?.topSellingProducts?.map(p => (p.name || 'Desconocido').substring(0, 15) + '...') || [],
    datasets: [{
      label: 'Unidades Vendidas',
      data: rankings?.topSellingProducts?.map(p => p.totalQuantity || 0) || [],
      backgroundColor: '#8b5cf6',
      borderRadius: 6
    }]
  };

  const calculateGrowth = (curr, prev) => {
    if (!prev || prev === 0) return null;
    const growth = ((curr - prev) / prev) * 100;
    return isFinite(growth) ? growth.toFixed(1) : (curr > 0 ? '100' : '0');
  };

  const periodRevenue = current?.periodRevenue || current?.revenue || 0;
  const periodOrders = current?.periodOrders || current?.totalOrders || 0;
  const prevRevenue = previous?.periodRevenue || 0;
  const prevOrders = previous?.periodOrders || 0;

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px' }}>
      
      {/* ALERTAS DE STOCK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {rankings?.outOfStockProducts?.length > 0 && (
          <div className="animate-slide-in" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '15px 25px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <AlertTriangle size={24} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 800 }}>STOCK AGOTADO</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Hay {rankings.outOfStockProducts.length} productos sin unidades.</p>
            </div>
            <button className="btn" onClick={() => navigate('/admin/productos')} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>Ver</button>
          </div>
        )}
        {rankings?.lowStockProducts?.length > 0 && (
          <div className="animate-slide-in" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '15px 25px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Activity size={24} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontWeight: 800 }}>STOCK BAJO</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>{rankings.lowStockProducts.length} productos en alerta de reposición.</p>
            </div>
            <button className="btn" onClick={() => navigate('/admin/productos')} style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.8rem' }}>Revisar</button>
          </div>
        )}
      </div>

      {/* HEADER & CONTROLES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '25px' }}>
        <div>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '5px' }}>Business Intelligence</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Panel de control analítico y logística</p>
             {(startDate !== firstDay || compare) && <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>FILTRO ACTIVO</span>}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', backgroundColor: 'var(--card)', padding: '10px 15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Comparar periodos</span>
            </label>

            <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', padding: '12px', border: '1px solid var(--border)', flexDirection: 'row' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted-foreground)', marginLeft: '5px' }}>PERÍODO PRINCIPAL</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ height: '38px', fontSize: '0.85rem' }} />
                  <span style={{ color: 'var(--muted-foreground)' }}>→</span>
                  <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ height: '38px', fontSize: '0.85rem' }} />
                </div>
              </div>
              
              <button onClick={handleFilter} className="btn" style={{ height: '38px', padding: '0 20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16}/> {compare ? 'Comparar períodos' : 'Filtrar'}
              </button>
              {(startDate !== firstDay || compare) && <button type="button" className="btn btn-outline" onClick={handleClearFilter} style={{ height: '38px', padding: '0 15px' }}>×</button>}
            </div>
          </div>

          {compare && (
            <div className="animate-slide-in card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', padding: '12px', border: '1px solid var(--warning)', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '5px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b' }}>PERÍODO DE COMPARACIÓN</span>
                    <Info size={12} color="#f59e0b" title="Seleccioná un período distinto para comparar resultados" />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="date" className="input-field" value={compareStart} onChange={e => setCompareStart(e.target.value)} style={{ height: '38px', fontSize: '0.85rem', borderColor: '#f59e0b' }} />
                    <span style={{ color: 'var(--muted-foreground)' }}>→</span>
                    <input type="date" className="input-field" value={compareEnd} onChange={e => setCompareEnd(e.target.value)} style={{ height: '38px', fontSize: '0.85rem', borderColor: '#f59e0b' }} />
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
      
      {/* SECCIÓN 1: MÉTRICAS POR PERIODO */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <Calendar size={24} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Métricas por Período</h3>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', marginLeft: '10px' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <PeriodStatCard 
            title="Ingresos" 
            value={`$${Number(periodRevenue).toLocaleString('es-AR')}`} 
            growth={calculateGrowth(periodRevenue, prevRevenue)}
            icon={<DollarSign size={20} />} 
            color="#10b981" 
          />
          <PeriodStatCard 
            title="Órdenes" 
            value={periodOrders} 
            growth={calculateGrowth(periodOrders, prevOrders)}
            icon={<ShoppingBag size={20} />} 
            color="#38bdf8" 
          />
          <PeriodStatCard 
            title="Nuevos Usuarios" 
            value={current?.newUsers || 0} 
            growth={calculateGrowth(current?.newUsers || 0, previous?.newUsers || 0)}
            icon={<Users size={20} />} 
            color="#ec4899" 
          />
          <PeriodStatCard 
            title="Ticket Promedio" 
            value={`$${(periodOrders ? periodRevenue / periodOrders : 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
            growth={calculateGrowth(periodOrders ? periodRevenue / periodOrders : 0, prevOrders ? prevRevenue / prevOrders : 0)}
            icon={<Activity size={20} />} 
            color="#f59e0b" 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px' }}>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800 }}>Evolución de Ingresos</h4>
            <div style={{ height: '350px' }}>
              <Line 
                data={salesChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, font: { weight: 700 } } } },
                  scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, x: { grid: { display: false } } }
                }} 
              />
            </div>
          </div>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800 }}>Crecimiento de Usuarios</h4>
            <div style={{ height: '350px' }}>
              <Line 
                data={userGrowthData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, x: { grid: { display: false } } }
                }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: MÉTRICAS GENERALES */}
      <section style={{ marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
          <Globe size={24} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Métricas Generales</h3>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', marginLeft: '10px' }}></div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <StatCard title="Total Órdenes" value={global?.totalOrders || 0} icon={<ShoppingBag size={20} />} bg="rgba(56, 189, 248, 0.1)" color="#38bdf8" />
          <StatCard title="Base Usuarios" value={global?.totalUsers || 0} icon={<Users size={20} />} bg="rgba(139, 92, 246, 0.1)" color="#8b5cf6" />
          <StatCard title="Productos Activos" value={global?.totalProducts || 0} icon={<Activity size={20} />} bg="rgba(245, 158, 11, 0.1)" color="#f59e0b" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '30px', marginBottom: '40px' }}>
          <div className="card" style={{ padding: '25px' }}>
            <h5 style={{ marginBottom: '20px', fontWeight: 800, textAlign: 'center' }}>Distribución de Stock</h5>
            <div style={{ height: '300px' }}>
              <Doughnut data={categoryStockData} options={{ maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } } } }} />
            </div>
          </div>
          <div className="card" style={{ padding: '25px' }}>
            <h5 style={{ marginBottom: '20px', fontWeight: 800, textAlign: 'center' }}>Top Productos (Views)</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {rankings?.topProducts?.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--secondary)', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>{p.name || 'Desconocido'}</span>
                  <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--card)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>{p.views || 0} views</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding: '25px' }}>
            <h5 style={{ marginBottom: '20px', fontWeight: 800, textAlign: 'center' }}>Métodos de Envío</h5>
            <div style={{ height: '300px' }}>
              <Pie data={shippingData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } } } }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
          <div className="card" style={{ padding: '30px' }}>
             <h4 style={{ marginBottom: '25px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}><Award color="#f59e0b" /> Top Clientes</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               {rankings?.topUsers?.map((u, i) => (
                 <div 
                   key={i} 
                   onClick={() => setSelectedClient(u)}
                   style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s' }}
                   onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--secondary)'; }}
                   onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                 >
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                     <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800 }}>{(u.name || 'U').charAt(0)}</div>
                     <div>
                       <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{u.name || 'Usuario'}</p>
                       <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{u.orderCount || 0} compras realizadas</p>
                     </div>
                   </div>
                   <div style={{ fontWeight: 800, color: 'var(--primary)' }}>${Number(u.totalSpent || 0).toLocaleString('es-AR')}</div>
                 </div>
               ))}
             </div>
          </div>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800 }}>Productos Más Vendidos (Periodo)</h4>
            <div style={{ height: '350px' }}>
              <Bar 
                data={topSellingData} 
                options={{ 
                  indexAxis: 'y', 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { legend: { display: false } },
                  scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
                }} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: HISTORIAL INTERACTIVO */}
      <section id="history-section" className="card" style={{ padding: '35px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <History size={24} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Historial de compras</h3>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
             <div style={{ position: 'relative' }}>
               <select 
                 className="input-field" 
                 style={{ width: '220px', paddingLeft: '35px' }}
                 value={historyFilters.clientId} 
                 onChange={e => setHistoryFilters(p => ({...p, clientId: e.target.value || 'all', page: 1}))}
               >
                 <option value="all">Todos los Clientes</option>
                 {users?.map(u => (
                   <option key={u.id} value={u.id}>{u.name}</option>
                 ))}
               </select>
               <Users size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
             </div>

             <select className="input-field" value={historyFilters.shippingType} onChange={e => setHistoryFilters(p => ({...p, shippingType: e.target.value, page: 1}))}>
               <option value="all">Todos</option>
               <option value="retiro">Retiro en tienda</option>
               <option value="envio">Envío a domicilio</option>
             </select>
             
             {(historyFilters.shippingType !== 'all' || (historyFilters.clientId && historyFilters.clientId !== 'all')) && (
               <button className="btn btn-outline" onClick={() => setHistoryFilters({ page: 1, shippingType: 'all', clientId: 'all' })}>Limpiar</button>
             )}
          </div>
        </div>

        {loadingHistory ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>Procesando historial...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '15px', color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Orden</th>
                  <th style={{ padding: '15px', color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Fecha</th>
                  <th style={{ padding: '15px', color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Cliente</th>
                  <th style={{ padding: '15px', color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Envío</th>
                  <th style={{ padding: '15px', color: 'var(--muted-foreground)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {history.orders?.length > 0 ? history.orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--secondary)'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '15px', fontWeight: 700 }}>#{o.id}</td>
                    <td style={{ padding: '15px' }}>{o.fecha_compra ? new Date(o.fecha_compra).toLocaleDateString('es-AR') : 'S/F'}</td>
                    <td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{o.User?.name || 'Anon'}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{o.User?.email || ''}</span>
                      </div>
                    </td>
                    <td style={{ padding: '15px' }}>
                      <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px', backgroundColor: 'var(--card)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>
                        {o.tipo_envio === 'retiro' ? 'Retiro en tienda' : (o.tipo_envio === 'envio' ? 'Envío a domicilio' : (o.shipping_method || 'Normal'))}
                      </span>
                    </td>
                    <td style={{ padding: '15px', fontWeight: 800, color: 'var(--primary)' }}>${Number(o.total || 0).toLocaleString('es-AR')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" style={{ padding: '50px', textAlign: 'center', color: 'var(--muted-foreground)' }}>Sin resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {history.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
            <button className="pagination-btn" disabled={history.currentPage === 1} onClick={() => setHistoryFilters(p => ({ ...p, page: p.page - 1 }))}><ChevronLeft size={18} /></button>
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700 }}>{history.currentPage} / {history.totalPages}</span>
            <button className="pagination-btn" disabled={history.currentPage === history.totalPages} onClick={() => setHistoryFilters(p => ({ ...p, page: p.page + 1 }))}><ChevronRight size={18} /></button>
          </div>
        )}
      </section>

      {selectedClient && (
        <ClientDetailModal 
          clientId={selectedClient.id} 
          clientName={selectedClient.name} 
          onClose={() => setSelectedClient(null)} 
        />
      )}

    </div>
  );
}

function PeriodStatCard({ title, value, growth, icon, color }) {
  return (
    <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ backgroundColor: `${color}15`, color: color, padding: '10px', borderRadius: '10px' }}>{icon}</div>
        {growth !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 800, color: parseFloat(growth) >= 0 ? '#10b981' : '#ef4444' }}>
            {parseFloat(growth) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase' }}>{title}</h4>
      <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{value}</span>
    </div>
  );
}

function StatCard({ title, value, icon, bg, color }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid var(--border)' }}>
      <div style={{ backgroundColor: bg, color: color, padding: '12px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {icon}
      </div>
      <div>
        <h4 style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>{title}</h4>
        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</span>
      </div>
    </div>
  );
}
