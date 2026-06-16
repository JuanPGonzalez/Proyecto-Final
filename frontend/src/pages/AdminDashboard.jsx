import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import Select from 'react-select';
import { Users, ShoppingBag, DollarSign, Activity, AlertTriangle, Calendar, Award, ChevronLeft, ChevronRight, Search, Globe, History, ArrowUpRight, ArrowDownRight, Info, Check, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isAdminRole } from '../constants/roles';
import { showToast } from '../utils/swal';
import ClientDetailModal from '../components/ClientDetailModal';
import OrderDetailModal from '../components/OrderDetailModal';
import CategoryProductsModal from '../components/CategoryProductsModal';
import { getStatusStyle } from '../constants/statusStyles';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [compare, setCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // Para el filtro de historial
  const [supportData, setSupportData] = useState(null);
  const [loadingSupport, setLoadingSupport] = useState(false);
  
  const getLocalDateStr = (d) => d.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayStr = getLocalDateStr(today);
  const firstDayStr = getLocalDateStr(firstDay);
  
  // Período Principal
  const [startDate, setStartDate] = useState(firstDayStr);
  const [endDate, setEndDate] = useState(todayStr);

  // Período de Comparación
  const [compareStart, setCompareStart] = useState('');
  const [compareEnd, setCompareEnd] = useState('');

  const [history, setHistory] = useState({ orders: [], totalPages: 1, currentPage: 1 });
  const [historyFilters, setHistoryFilters] = useState({ page: 1, shippingType: 'all', clientId: 'all', specificDate: '', categoryName: '', productName: '' });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedCategoryModal, setSelectedCategoryModal] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !isAdminRole(user)) {
      return navigate('/forbidden');
    }
    fetchDashboardData();
    fetchSupportData();
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    fetchPurchaseHistory();
    fetchSupportData();
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
        headers: { Authorization: `Bearer ${token}` },
        params: { tipoUsuario: 'cliente' }
      });
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSupportData = async () => {
    setLoadingSupport(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        startDate,
        endDate,
        clientId: historyFilters.clientId
      };

      const res = await axios.get('http://localhost:5000/api/admin/dashboard/support', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setSupportData(res.data);
    } catch (error) {
      console.error('Error fetching support data:', error);
    } finally {
      setLoadingSupport(false);
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
    fetchSupportData();
  };

  const handleClearFilter = () => {
    setStartDate(firstDay);
    setEndDate(todayStr);
    setCompareStart('');
    setCompareEnd('');
    setCompare(false);
    setHistoryFilters({ page: 1, shippingType: 'all', clientId: 'all' });
    setTimeout(() => {
      fetchDashboardData();
      fetchSupportData();
    }, 100);
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

  // ── Helpers para normalización del Eje X ──────────────────────────────────
  // Genera un array de strings YYYY-MM-DD entre dos fechas inclusive
  const generateDateRange = (start, end) => {
    if (!start || !end) return [];
    const dates = [];
    const cur = new Date(start + 'T00:00:00');
    const last = new Date(end + 'T00:00:00');
    while (cur <= last) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  // Mapea un array de { date, [valueKey] } a un rango de fechas completo, rellenando con 0
  const mapDataToRange = (dataArr, dateRange, valueKey) => {
    const map = {};
    (dataArr || []).forEach(item => {
      if (item.date) {
        const d = item.date.split('T')[0];
        map[d] = Number(item[valueKey]) || 0;
      }
    });
    return dateRange.map(d => map[d] ?? 0);
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Construir datos de evolución de ingresos
  let salesLabels, salesCurrentData, salesPreviousData;
  if (compare && previous?.salesTrend) {
    const currRange = generateDateRange(startDate, endDate);
    const prevRange = generateDateRange(compareStart, compareEnd);
    const maxLen = Math.max(currRange.length, prevRange.length);
    salesLabels = Array.from({ length: maxLen }, (_, i) => `Día ${i + 1}`);
    salesCurrentData = mapDataToRange(current?.salesTrend, currRange, 'total');
    salesPreviousData = mapDataToRange(previous.salesTrend, prevRange, 'total');
    // Pad shorter arrays with 0s
    while (salesCurrentData.length < maxLen) salesCurrentData.push(0);
    while (salesPreviousData.length < maxLen) salesPreviousData.push(0);
  } else {
    const currRange = generateDateRange(startDate, endDate);
    salesLabels = currRange.length > 0
      ? currRange.map(d => new Date(d + 'T00:00:00').toLocaleDateString('es-AR'))
      : (current?.salesTrend?.map(t => t.date ? new Date(t.date).toLocaleDateString('es-AR') : '') || []);
    salesCurrentData = currRange.length > 0
      ? mapDataToRange(current?.salesTrend, currRange, 'total')
      : (current?.salesTrend?.map(t => t.total || 0) || []);
    salesPreviousData = null;
  }

  const salesChartData = {
    labels: salesLabels,
    datasets: [
      {
        label: compare ? `Período Actual (${startDate} → ${endDate})` : 'Ingresos',
        data: salesCurrentData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.15)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: salesCurrentData.length <= 31 ? 4 : 2,
        pointBackgroundColor: '#3b82f6'
      },
      salesPreviousData ? {
        label: `Período Anterior (${compareStart} → ${compareEnd})`,
        data: salesPreviousData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.15)',
        borderWidth: 2,
        borderDash: [6, 4],
        fill: true,
        tension: 0.4,
        pointRadius: 0
      } : null
    ].filter(Boolean)
  };

  // Construir datos de crecimiento de usuarios
  let userLabels, userCurrentData, userPreviousData;
  if (compare && previous?.userRegistrations) {
    const currRange = generateDateRange(startDate, endDate);
    const prevRange = generateDateRange(compareStart, compareEnd);
    const maxLen = Math.max(currRange.length, prevRange.length);
    userLabels = Array.from({ length: maxLen }, (_, i) => `Día ${i + 1}`);
    userCurrentData = mapDataToRange(current?.userRegistrations, currRange, 'count');
    userPreviousData = mapDataToRange(previous.userRegistrations, prevRange, 'count');
    while (userCurrentData.length < maxLen) userCurrentData.push(0);
    while (userPreviousData.length < maxLen) userPreviousData.push(0);
  } else {
    const currRange = generateDateRange(startDate, endDate);
    userLabels = currRange.length > 0
      ? currRange.map(d => new Date(d + 'T00:00:00').toLocaleDateString('es-AR'))
      : (current?.userRegistrations?.map(u => u.date ? new Date(u.date).toLocaleDateString('es-AR') : '') || []);
    userCurrentData = currRange.length > 0
      ? mapDataToRange(current?.userRegistrations, currRange, 'count')
      : (current?.userRegistrations?.map(u => u.count || 0) || []);
    userPreviousData = null;
  }

  const userGrowthData = {
    labels: userLabels,
    datasets: [
      {
        label: compare ? `Período Actual (${startDate} → ${endDate})` : 'Nuevos Usuarios',
        data: userCurrentData,
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: userCurrentData.length <= 31 ? 4 : 2,
        pointBackgroundColor: '#ec4899'
      },
      userPreviousData ? {
        label: `Período Anterior (${compareStart} → ${compareEnd})`,
        data: userPreviousData,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        borderDash: [6, 4],
        fill: true,
        tension: 0.4,
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
    labels: rankings?.shippingMethods?.map(s => s.method || 'OTRO') || [],
    datasets: [{
      data: rankings?.shippingMethods?.map(s => s.count || 0) || [],
      backgroundColor: ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'],
      borderWidth: 0
    }]
  };

  const topSellingData = {
    labels: rankings?.topSellingProducts?.map(p => {
      const n = p.name || 'Desconocido';
      return n.length > 25 ? n.substring(0, 25) + '...' : n;
    }) || [],
    datasets: [{
      label: 'Unidades Vendidas',
      data: rankings?.topSellingProducts?.map(p => p.totalQuantity || 0) || [],
      backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
      borderRadius: 6,
      barThickness: 25,
      maxBarThickness: 30
    }]
  };

  const supportTrendData = {
    labels: supportData?.charts?.ticketsTrend?.map(t => new Date(t.date).toLocaleDateString('es-AR')) || [],
    datasets: [
      {
        label: 'Tickets Creados',
        data: supportData?.charts?.ticketsTrend?.map(t => t.count) || [],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.3
      },
      {
        label: 'Tickets Resueltos',
        data: supportData?.charts?.ticketsTrend?.map(t => t.resolvedCount || 0) || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.3
      }
    ]
  };

  const supportStatusData = {
    labels: ['Abiertos', 'Cerrados'],
    datasets: [
      {
        data: [supportData?.metrics?.abiertos || 0, supportData?.metrics?.cerrados || 0],
        backgroundColor: ['#f59e0b', '#10b981'],
        borderWidth: 0,
        hoverOffset: 10
      }
    ]
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
      
      {/* SECCIÓN 0: ANALYTICS COMERCIALES */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <Activity size={28} color="var(--primary)" />
        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 900 }}>Analytics Comerciales</h2>
        <div style={{ flex: 1, height: '2px', backgroundColor: 'var(--border)', opacity: 0.5 }}></div>
      </div>
      
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '25px' }}>
        <div>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '5px', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>Business Intelligence</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <p style={{ color: 'var(--muted-foreground)', margin: 0 }}>Panel de control analítico y logística</p>
             {(startDate !== firstDay || compare) && <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>FILTRO ACTIVO</span>}
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
          {/* Toggle comparar */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', backgroundColor: compare ? 'rgba(245,158,11,0.08)' : 'var(--card)', padding: '8px 15px', borderRadius: 'var(--radius-md)', border: `1px solid ${compare ? '#f59e0b' : 'var(--border)'}`, transition: 'all 0.2s' }}>
            <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: compare ? '#f59e0b' : 'inherit' }}>Comparar períodos</span>
          </label>

          {/* Controles de fechas — inline cuando compare está activo */}
          <div className="card" style={{ display: 'flex', gap: '0', alignItems: 'stretch', padding: '0', border: `1px solid ${compare ? '#f59e0b' : 'var(--border)'}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', transition: 'border-color 0.2s' }}>
            
            {/* Período Principal */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 14px', backgroundColor: 'var(--card)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período Principal</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ height: '34px', fontSize: '0.82rem', padding: '0 8px', minWidth: '130px' }} />
                <span style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>→</span>
                <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ height: '34px', fontSize: '0.82rem', padding: '0 8px', minWidth: '130px' }} />
              </div>
            </div>

            {/* Divisor vertical + "VS" — solo cuando compare está activo */}
            {compare && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 14px', backgroundColor: 'rgba(245,158,11,0.08)', borderLeft: '1px solid #f59e0b', borderRight: '1px solid #f59e0b' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.1em' }}>VS</span>
              </div>
            )}

            {/* Período de Comparación — solo cuando compare está activo */}
            {compare && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '10px 14px', backgroundColor: 'rgba(245,158,11,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período de Comparación</span>
                  <Info size={11} color="#f59e0b" title="Seleccioná un período distinto para comparar resultados" />
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" className="input-field" value={compareStart} onChange={e => setCompareStart(e.target.value)} style={{ height: '34px', fontSize: '0.82rem', padding: '0 8px', minWidth: '130px', borderColor: '#f59e0b' }} />
                  <span style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>→</span>
                  <input type="date" className="input-field" value={compareEnd} onChange={e => setCompareEnd(e.target.value)} style={{ height: '34px', fontSize: '0.82rem', padding: '0 8px', minWidth: '130px', borderColor: '#f59e0b' }} />
                </div>
              </div>
            )}

            {/* Botón Aplicar — siempre visible al final */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', gap: '6px', backgroundColor: 'var(--secondary)', borderLeft: '1px solid var(--border)' }}>
              <button onClick={handleFilter} className="btn" style={{ height: '34px', padding: '0 16px', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                <Search size={14}/> {compare ? 'Comparar' : 'Aplicar'}
              </button>
              {(startDate !== firstDay || compare) && (
                <button type="button" className="btn btn-outline" onClick={handleClearFilter} style={{ height: '34px', padding: '0 10px', fontWeight: 700, fontSize: '0.85rem' }} title="Limpiar filtros">×</button>
              )}
            </div>
          </div>
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
            title="Compra Promedio" 
            value={`$${(periodOrders ? periodRevenue / periodOrders : 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`} 
            growth={calculateGrowth(periodOrders ? periodRevenue / periodOrders : 0, prevOrders ? prevRevenue / prevOrders : 0)}
            icon={<Activity size={20} />} 
            color="#f59e0b" 
          />
          {/* Support KPI integrated */}
          <PeriodStatCard 
            title="Tickets Abiertos" 
            value={supportData?.metrics?.abiertos || 0} 
            icon={<AlertTriangle size={20} />} 
            color="#f59e0b" 
            growth={null}
          />
          <PeriodStatCard 
            title="Tickets Cerrados" 
            value={supportData?.metrics?.cerrados || 0} 
            icon={<Check size={20} />} 
            color="#10b981" 
            growth={null}
          />
          <PeriodStatCard 
            title="Tickets del Período" 
            value={supportData?.metrics?.totalPeriodo || 0} 
            icon={<Calendar size={20} />} 
            color="#3b82f6" 
            growth={null}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px', marginBottom: '30px' }}>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800 }}>Evolución de Ingresos</h4>
            <div style={{ height: '350px' }}>
              <Line 
                data={salesChartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false, 
                  plugins: { 
                    legend: { 
                      position: 'top', 
                      align: 'end', 
                      labels: { usePointStyle: true, boxWidth: 6, font: { weight: 700 } } 
                    },
                    tooltip: {
                      callbacks: {
                        title: (items) => compare ? items[0].label : items[0].label,
                        label: (item) => ` ${item.dataset.label}: $${Number(item.raw).toLocaleString('es-AR')}`
                      }
                    }
                  },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { callback: v => `$${Number(v).toLocaleString('es-AR')}` } }, 
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10, maxRotation: 0 } } 
                  },
                  onClick: (event, elements) => {
                    if (!compare && elements.length > 0) {
                      const dataIndex = elements[0].index;
                      const label = salesChartData.labels[dataIndex];
                      setHistoryFilters(prev => ({ ...prev, specificDate: label, page: 1 }));
                      document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
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
                  plugins: { 
                    legend: { display: compare, position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 6, font: { weight: 700 } } },
                    tooltip: {
                      callbacks: {
                        label: (item) => ` ${item.dataset.label}: ${item.raw} usuario${item.raw !== 1 ? 's' : ''}`
                      }
                    }
                  },
                  scales: { 
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { stepSize: 1 } }, 
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10, maxRotation: 0 } } 
                  }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Support Trend Chart integrated into Section 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '30px' }}>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800 }}>Tendencia de Tickets (Soporte)</h4>
            <div style={{ height: '350px' }}>
              {supportData?.charts?.ticketsTrend?.length > 0 ? (
                <Line 
                  data={supportTrendData} 
                  options={{ 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.03)' } }, x: { grid: { display: false } } }
                  }} 
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
                  No hay tickets en este período
                </div>
              )}
            </div>
          </div>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800, textAlign: 'center' }}>Distribución Soporte</h4>
            <div style={{ height: '350px' }}>
              <Doughnut 
                data={supportStatusData} 
                options={{ 
                  maintainAspectRatio: false, 
                  cutout: '70%',
                  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { weight: 700 } } } }
                }} 
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 0.8fr', gap: '20px', marginTop: '30px', alignItems: 'start' }}>
          <div className="card" style={{ padding: '30px' }}>
             <h4 style={{ marginBottom: '25px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}><Award color="#f59e0b" /> Top Clientes</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {rankings?.topUsers?.map((u, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedClient(u)}
                    style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '18px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.backgroundColor = 'var(--secondary)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>{(u.name || 'U').charAt(0).toUpperCase()}</div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>{u.name || 'Usuario'}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>{u.orderCount} órdenes totales</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>${Number(u.totalSpent || 0).toLocaleString('es-AR')}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Total Vendido</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                       <div style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#10b981' }}>CERRADAS</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800 }}>{u.closedCount}</span>
                       </div>
                       <div style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#ef4444' }}>CANCELADAS</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800 }}>{u.cancelledCount}</span>
                       </div>
                       <div style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#f59e0b' }}>PENDIENTES</span>
                          <span style={{ fontSize: '1rem', fontWeight: 800 }}>{u.pendingCount}</span>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp color="#8b5cf6" /> Productos Más Vendidos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {(() => {
                const products = rankings?.topSellingProducts || [];
                const maxQuantity = Math.max(...products.map(p => p.totalQuantity), 1);
                const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                
                if (products.length === 0) {
                  return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted-foreground)' }}>Sin datos de ventas en este periodo.</div>;
                }

                return products.map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setHistoryFilters(prev => ({ ...prev, productName: p.name, page: 1 }));
                      document.getElementById('history-section')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{ cursor: 'pointer', transition: 'all 0.2s', padding: '12px', borderRadius: '12px', border: '1px solid transparent' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.backgroundColor = 'var(--secondary)'; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', maxWidth: '70%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name || 'Desconocido'}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: colors[i % colors.length] }}>{p.totalQuantity} ud.</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${(p.totalQuantity / maxQuantity) * 100}%`, 
                        height: '100%', 
                        backgroundColor: colors[i % colors.length], 
                        borderRadius: '4px',
                        transition: 'width 1s ease-in-out'
                      }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="card" style={{ padding: '30px' }}>
            <h4 style={{ marginBottom: '25px', fontWeight: 800, textAlign: 'center' }}>Métodos de Envío</h4>
            <div style={{ height: '350px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Pie 
                data={shippingData} 
                options={{ 
                  maintainAspectRatio: false, 
                  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 11, weight: '600' } } } }, 
                  onClick: (event, elements) => { 
                    if(elements.length > 0){ 
                      const idx = elements[0].index; 
                      const label = shippingData.labels[idx]; 
                      setHistoryFilters(prev => ({...prev, shippingType: label, page: 1})); 
                      document.getElementById('history-section')?.scrollIntoView({behavior: 'smooth'}); 
                    } 
                  } 
                }} 
              />
            </div>
          </div>
        </div>

      </section>

      {/* SECCIÓN 4: HISTORIAL INTERACTIVO */}
      <section id="history-section" className="card" style={{ padding: '35px', marginBottom: '60px' }}>
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
               <option value="Retiro en tienda">Retiro en tienda</option>
               <option value="Envío a domicilio">Envío a domicilio</option>
             </select>
             
             {(historyFilters.shippingType !== 'all' || (historyFilters.clientId && historyFilters.clientId !== 'all') || historyFilters.specificDate || historyFilters.categoryName || historyFilters.productName) && (
               <button className="btn btn-outline" onClick={() => setHistoryFilters({ page: 1, shippingType: 'all', clientId: 'all', specificDate: '', categoryName: '', productName: '' })}>Limpiar</button>
             )}
          </div>
        </div>

        {/* ACTIVE FILTERS TAGS */}
        {(historyFilters.specificDate || historyFilters.categoryName || historyFilters.productName) && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {historyFilters.specificDate && (
              <span style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Fecha: {historyFilters.specificDate} 
                <button onClick={() => setHistoryFilters(p => ({...p, specificDate: '', page: 1}))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>×</button>
              </span>
            )}
            {historyFilters.categoryName && (
              <span style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Categoría: {historyFilters.categoryName} 
                <button onClick={() => setHistoryFilters(p => ({...p, categoryName: '', page: 1}))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>×</button>
              </span>
            )}
            {historyFilters.productName && (
              <span style={{ backgroundColor: '#f59e0b', color: 'white', padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Producto: {historyFilters.productName} 
                <button onClick={() => setHistoryFilters(p => ({...p, productName: '', page: 1}))} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>×</button>
              </span>
            )}
          </div>
        )}

        {loadingHistory ? (
          <div style={{ padding: '50px', textAlign: 'center' }}>Procesando historial...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {history.orders?.length > 0 ? history.orders.map(o => (
              <div 
                key={o.id} 
                onClick={() => setSelectedOrder(o.id)}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: '15px', 
                  padding: '20px', 
                  backgroundColor: 'var(--card)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  alignItems: 'center'
                }} 
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'; }} 
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Orden</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>#{o.id}</span>
                </div>
                
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Fecha</span>
                  <span style={{ fontWeight: 600 }}>{o.fecha_compra ? new Date(o.fecha_compra).toLocaleDateString('es-AR') : 'S/F'}</span>
                </div>
                
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Cliente</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700 }}>{o.User?.name || 'Anon'}</span>
                  </div>
                </div>
                
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Envío</span>
                  <span style={{ fontSize: '0.85rem', padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--secondary)', fontWeight: 600, textTransform: 'capitalize' }}>
                    {o.tipo_envio || o.shipping_method || 'Normal'}
                  </span>
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Estado</span>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, 
                    backgroundColor: getStatusStyle(o.status).bg, 
                    color: getStatusStyle(o.status).text 
                  }}>
                    {(o.status || 'Pendiente').toUpperCase()}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '5px' }}>Total</span>
                  <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem' }}>${Number(o.total || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--muted-foreground)', backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px dashed var(--border)' }}>Sin resultados.</div>
            )}
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '40px' }}>
          <div className="card" style={{ padding: '25px' }}>
            <h5 style={{ marginBottom: '20px', fontWeight: 800, textAlign: 'center' }}>Distribución de Stock</h5>
            <div style={{ height: '300px' }}>
              <Doughnut 
                data={categoryStockData} 
                options={{ 
                  maintainAspectRatio: false, 
                  cutout: '75%', 
                  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } } },
                  onClick: (event, elements) => {
                    if (elements.length > 0) {
                      const idx = elements[0].index;
                      const catData = rankings?.productsByCategory?.[idx];
                      if (catData && catData.id) {
                        setSelectedCategoryModal({ id: catData.id, name: catData.category });
                      }
                    }
                  }
                }} 
              />
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
        </div>
      </section>

      {/* SECCIÓN 5: MOTOR DE PRICING Y DEMANDA */}
      <PricingHistorySection />

      {selectedClient && (
        <ClientDetailModal 
          clientId={selectedClient.id} 
          clientName={selectedClient.name} 
          startDate={startDate}
          endDate={endDate}
          onClose={() => setSelectedClient(null)} 
        />
      )}

      {selectedOrder && (
        <OrderDetailModal 
          orderId={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {selectedCategoryModal && (
        <CategoryProductsModal 
          categoryId={selectedCategoryModal.id}
          categoryName={selectedCategoryModal.name}
          onClose={() => setSelectedCategoryModal(null)}
        />
      )}
    </div>
  );
}

function PeriodStatCard({ title, value, growth, icon, color }) {
  return (
    <div className="card" style={{ padding: '20px', border: `1px solid ${color}30`, position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, var(--card) 0%, ${color}05 100%)`, backdropFilter: 'blur(10px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ backgroundColor: `${color}15`, color: color, padding: '10px', borderRadius: '10px', boxShadow: `0 4px 10px ${color}10` }}>{icon}</div>
        {growth !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 800, color: parseFloat(growth) >= 0 ? '#10b981' : '#ef4444', backgroundColor: parseFloat(growth) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
            {parseFloat(growth) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
      <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--foreground)' }}>{value}</span>
    </div>
  );
}

function StatCard({ title, value, icon, bg, color }) {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', border: `1px solid ${color}20`, background: `linear-gradient(to right, var(--card), ${color}05)` }}>
      <div style={{ backgroundColor: bg, color: color, padding: '12px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: `0 4px 12px ${color}15` }}>
        {icon}
      </div>
      <div>
        <h4 style={{ color: 'var(--muted-foreground)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</span>
      </div>
    </div>
  );
}

function PricingHistorySection() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/products/pricing/summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        const options = res.data.map(p => ({ value: p.id, label: p.name, ...p }));
        setProducts(options);
      })
      .catch(err => console.error("Error fetching products summary:", err));
  }, []);

  const handleProductSelect = async (selectedOption) => {
    if (!selectedOption) {
      setSelectedProduct(null);
      setHistoryLogs([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/products/${selectedOption.value || selectedOption.id}/price-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedProduct(res.data.product);
      setHistoryLogs(res.data.logs.slice(-7));
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  };

  let ultimoEstado = 'Sin cambios';
  let ultimoMotivo = 'No hay registros de fluctuación';
  let origenTexto = 'Ninguno';
  let colorEstado = 'var(--foreground)';
  
  if (historyLogs.length > 0) {
    const lastLog = historyLogs[historyLogs.length - 1];
    
    if (lastLog.origen === 'motor') origenTexto = '⚙️ Motor Automático';
    else if (lastLog.origen === 'manual') origenTexto = '👤 Admin Manual';
    else if (lastLog.origen === 'masivo') origenTexto = '📦 Modificación Masiva';
    else origenTexto = 'Desconocido';

    ultimoMotivo = lastLog.detalle || 'Sin detalle';
    
    const prev = Number(lastLog.precio_anterior);
    const curr = Number(lastLog.precio_nuevo);
    if (curr > prev) {
      ultimoEstado = 'Subió';
      colorEstado = '#ef4444';
    } else if (curr < prev) {
      ultimoEstado = 'Bajó';
      colorEstado = '#10b981';
    } else {
      ultimoEstado = 'Se mantuvo';
    }
  }

  const getOriginColor = (origen) => {
    if (origen === 'motor') return '#10b981';
    if (origen === 'manual') return '#f59e0b';
    if (origen === 'masivo') return '#8b5cf6';
    return '#10b981';
  };

  const getOriginName = (origen) => {
    if (origen === 'motor') return 'Motor IA';
    if (origen === 'manual') return 'Edición Manual';
    if (origen === 'masivo') return 'Actualización Masiva';
    return 'Desconocido';
  };

  const chartData = {
    labels: historyLogs.map(log => new Date(log.created_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Evolución de Precio ($)',
        data: historyLogs.map(log => Number(log.precio_nuevo)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 6,
        pointBackgroundColor: historyLogs.map(log => getOriginColor(log.origen)),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 8
      }
    ]
  };

  if (selectedProduct && historyLogs.length === 0) {
    chartData.labels = [new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })];
    chartData.datasets[0].data = [Number(selectedProduct.price)];
  }

  return (
    <section style={{ marginTop: '60px', marginBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
        <TrendingUp size={24} color="var(--primary)" />
        <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Historial de Precios</h3>
        <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', marginLeft: '10px' }}></div>
      </div>

      <div className="card" style={{ padding: '30px' }}>
        <div style={{ marginBottom: '30px', maxWidth: '600px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Buscar Producto para analizar fluctuación:</label>
          <Select
            options={products}
            onChange={handleProductSelect}
            placeholder="Seleccione un producto..."
            isClearable
            formatOptionLabel={(option, { context }) => {
              if (context === 'value') {
                return <span style={{ fontWeight: 600 }}>{option.name}</span>;
              }
              
              let trendText = 'Se mantuvo estable';
              let trendColor = 'var(--muted-foreground)';
              if (option.trend === 'subio') {
                trendText = 'Subió en último ajuste';
                trendColor = '#ef4444'; // Red para suba de precio
              } else if (option.trend === 'bajo') {
                trendText = 'Bajó en último ajuste';
                trendColor = '#10b981'; // Verde para baja de precio
              }

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {option.name}
                      {option.recentAIUpdate && (
                        <span title="Precio modificado por el Motor de IA en las últimas 24hs" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '0.65rem' }}>
                          <Sparkles size={10} /> IA Pricing
                        </span>
                      )}
                    </span>
                    {option.Category && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{option.Category.descripcion}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>${Number(option.price).toLocaleString('es-AR')}</span>
                    <div style={{ fontSize: '0.75rem', color: trendColor, fontWeight: 700 }}>
                      {trendText}
                    </div>
                  </div>
                </div>
              );
            }}
            styles={{ 
              control: (base) => ({ ...base, minHeight: '55px', borderRadius: '8px' }),
              option: (base) => ({ ...base, padding: '10px 15px', borderBottom: '1px solid var(--border)' }),
              menuPortal: base => ({ ...base, zIndex: 9999 })
            }}
            menuPortalTarget={document.body}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Cargando historial de precios...</div>
        ) : selectedProduct ? (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, padding: '20px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>PRECIO ACTUAL</p>
                <h4 style={{ margin: '5px 0 0 0', fontSize: '1.8rem', color: '#3b82f6', fontWeight: 900 }}>${Number(selectedProduct.price).toLocaleString('es-AR')}</h4>
              </div>
              <div style={{ flex: 1, padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>ÚLTIMO MOVIMIENTO</p>
                <h4 style={{ margin: '5px 0 0 0', fontSize: '1.8rem', color: colorEstado, fontWeight: 900 }}>
                  {ultimoEstado}
                </h4>
              </div>
              <div style={{ flex: 1.5, padding: '20px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>ORIGEN DEL AJUSTE</p>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{origenTexto}</span>
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)', fontWeight: 600, lineHeight: '1.4' }}>
                  {ultimoMotivo}
                </h4>
              </div>
            </div>

            <div style={{ height: '400px', width: '100%' }}>
              <Line 
                data={chartData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: true, position: 'top' },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) label += ': ';
                          if (context.parsed.y !== null) {
                            label += '$' + context.parsed.y.toLocaleString('es-AR');
                          }
                          const log = historyLogs[context.dataIndex];
                          if (log && log.origen) {
                             label += ' | Origen: ' + getOriginName(log.origen);
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: { 
                    y: { 
                      beginAtZero: false, 
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      ticks: { callback: (val) => '$' + val.toLocaleString('es-AR') } 
                    }, 
                    x: { 
                      grid: { display: false },
                      ticks: {
                        callback: function(val) {
                          const label = this.getLabelForValue(val);
                          return label ? label.split(',')[0] : '';
                        }
                      }
                    } 
                  }
                }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#10b981', border: '2px solid #fff', boxShadow: '0 0 0 1px #10b981' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>Motor IA</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#f59e0b', border: '2px solid #fff', boxShadow: '0 0 0 1px #f59e0b' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>Edición Manual</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#8b5cf6', border: '2px solid #fff', boxShadow: '0 0 0 1px #8b5cf6' }}></div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>Actualización Masiva</span>
              </div>
            </div>

            {historyLogs.length === 0 && (
              <p style={{ textAlign: 'center', marginTop: '15px', color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                Este producto aún no registra fluctuaciones automáticas por demanda. Solo se muestra su precio actual.
              </p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'var(--secondary)', borderRadius: '12px', color: 'var(--muted-foreground)' }}>
            Selecciona un producto del buscador para visualizar la demostración del motor de precios automáticos basado en la demanda.
          </div>
        )}
      </div>
    </section>
  );
}
