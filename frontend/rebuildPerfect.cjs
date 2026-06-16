const fs = require('fs');

const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find all indices perfectly
let topEnd = -1;
let sec1End = -1;
let sec2End = -1;
let sec4End = -1;
let returnStart = -1;

for (let i=0; i<lines.length; i++) {
  if (lines[i].includes('SECCIÓN 1: MÉTRICAS POR PERIODO')) topEnd = i;
  if (lines[i].includes('SECCIÓN 2: MÉTRICAS GENERALES')) sec1End = i;
  if (lines[i].includes('SECCIÓN 4: HISTORIAL INTERACTIVO')) sec2End = i;
  if (lines[i].includes('SECCIÓN 5: MOTOR DE PRICING Y DEMANDA')) sec4End = i;
  if (lines[i].trim() === ');') returnStart = i; // The end of the return statement
}

if (topEnd === -1 || sec1End === -1 || sec2End === -1 || sec4End === -1 || returnStart === -1) {
  console.log("Error: could not find sections");
  process.exit(1);
}

// Slices (end is exclusive)
let topLines = lines.slice(0, topEnd);
let sec1Lines = lines.slice(topEnd, sec1End); // Periodo
let sec2Lines = lines.slice(sec1End, sec2End); // Generales
let sec4Lines = lines.slice(sec2End, sec4End); // Historial

// We discard sec5Lines completely, we will replace it with our own string.

// Fix historyFilters useEffect inside topLines
for (let i=0; i<topLines.length; i++) {
  if (topLines[i].includes('}, [historyFilters]);')) {
    topLines[i] = topLines[i].replace('}, [historyFilters]);', '}, [historyFilters, startDate, endDate]);');
  }
}

// Assemble exactly as requested: Top -> Sec1 -> Sec4 -> Sec2 -> PriceHistory
let finalLines = [
  ...topLines,
  ...sec1Lines,
  ...sec4Lines,
  ...sec2Lines
];

const priceHistoryCode = `
      {/* SECCIÓN 5: HISTÓRICO DE PRECIOS POR PRODUCTO */}
      <section style={{ marginTop: '60px', marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <TrendingUp size={24} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Historial de Precios por Producto</h3>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)', minWidth: '100px' }}></div>
        </div>

        <div className="card" style={{ padding: '30px' }}>
          <div style={{ marginBottom: '30px', maxWidth: '600px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700 }}>Buscar Producto para analizar fluctuación:</label>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                <div style={{ flex: 1 }}>
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
                            <span style={{ fontWeight: 600 }}>{option.name}</span>
                            {option.Category && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{option.Category.descripcion}</span>}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>$\${Number(option.price).toLocaleString('es-AR')}</span>
                            <div style={{ fontSize: '0.75rem', color: trendColor, fontWeight: 700 }}>{trendText}</div>
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
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>FILTRAR POR FECHAS:</span>
                <input type="date" className="input-field" value={priceStartDate} onChange={e => setPriceStartDate(e.target.value)} style={{ height: '38px', fontSize: '0.85rem' }} />
                <span style={{ color: 'var(--muted-foreground)' }}>→</span>
                <input type="date" className="input-field" value={priceEndDate} onChange={e => setPriceEndDate(e.target.value)} style={{ height: '38px', fontSize: '0.85rem' }} />
                <button onClick={() => { if(selectedProduct) fetchPriceHistory(selectedProduct.value); }} className="btn" style={{ height: '38px', padding: '0 15px' }}>Aplicar</button>
            </div>
          </div>

          {loadingPriceHistory ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>Cargando historial de precios...</div>
          ) : selectedProduct ? (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, padding: '20px', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>PRECIO ACTUAL</p>
                  <h4 style={{ margin: '5px 0 0 0', fontSize: '1.8rem', color: '#3b82f6', fontWeight: 900 }}>$\${Number(selectedProduct.price).toLocaleString('es-AR')}</h4>
                </div>
                <div style={{ flex: 1, padding: '20px', backgroundColor: 'rgba(16, 185, 129, 0.05)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>ESTADO DEL ÚLTIMO MOVIMIENTO</p>
                  <h4 style={{ margin: '5px 0 0 0', fontSize: '1.8rem', color: colorEstado, fontWeight: 900 }}>{ultimoEstado}</h4>
                </div>
                <div style={{ flex: 1, padding: '20px', backgroundColor: 'rgba(245, 158, 11, 0.05)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted-foreground)' }}>MOTIVO DEL MOVIMIENTO</p>
                  <h4 style={{ margin: '5px 0 0 0', fontSize: '1.2rem', color: '#f59e0b', fontWeight: 700, lineHeight: '1.4' }}>{ultimoMotivo}</h4>
                </div>
              </div>

              {/* LEYENDA DEL GRÁFICO */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '10px', fontSize: '0.8rem', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                  <span>Motor IA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
                  <span>Manual (Admin)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#8b5cf6' }}></div>
                  <span>Actualización Masiva</span>
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
                            if (context.parsed.y !== null) label += '$' + context.parsed.y.toLocaleString('es-AR');
                            return label;
                          },
                          afterLabel: function(context) {
                            const logIndex = context.dataIndex;
                            if (historyLogs[logIndex]) {
                              const origen = historyLogs[logIndex].origen;
                              const origenTxt = origen === 'motor' ? 'Motor Automático' : (origen === 'manual' ? 'Edición Manual' : 'Carga Masiva');
                              return \`Origen: \${origenTxt}\`;
                            }
                            return '';
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
                      x: { grid: { display: false } } 
                    }
                  }} 
                />
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
`;

// Append PriceHistory and closing brackets
let finalString = finalLines.join('\n') + '\n' + priceHistoryCode + '\n  );\n}\n';

// Now inject the state variables for Price History:
const stateInjection = `
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [priceStartDate, setPriceStartDate] = useState('');
  const [priceEndDate, setPriceEndDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:5000/api/products/pricing/summary', {
        headers: { Authorization: \`Bearer \${token}\` }
      })
      .then(res => {
        const options = res.data.map(p => ({ value: p.id, label: p.name, ...p }));
        setProducts(options);
      })
      .catch(err => console.error("Error fetching products summary:", err));
  }, []);

  const fetchPriceHistory = async (productId) => {
    setLoadingPriceHistory(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (priceStartDate) params.startDate = priceStartDate;
      if (priceEndDate) params.endDate = priceEndDate;
      const res = await axios.get(\`http://localhost:5000/api/products/\${productId}/price-history\`, {
        headers: { Authorization: \`Bearer \${token}\` },
        params
      });
      setSelectedProduct(res.data.product);
      setHistoryLogs(res.data.logs);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const handleProductSelect = async (selectedOption) => {
    if (!selectedOption) {
      setSelectedProduct(null);
      setHistoryLogs([]);
      return;
    }
    fetchPriceHistory(selectedOption.value);
  };

  let ultimoEstado = 'Sin cambios';
  let ultimoMotivo = 'No hay registros de fluctuación';
  let colorEstado = 'var(--foreground)';
  
  if (historyLogs.length > 0) {
    const lastLog = historyLogs[historyLogs.length - 1];
    
    // Formatear motivo con el origen explícito
    let origenTexto = '';
    if (lastLog.origen === 'motor') origenTexto = 'Motor Automático';
    else if (lastLog.origen === 'manual') origenTexto = 'Modificación de Administrador';
    else if (lastLog.origen === 'masivo') origenTexto = 'Modificación Masiva';
    
    ultimoMotivo = origenTexto ? \`\${origenTexto}: \${lastLog.detalle || 'Sin detalle'}\` : (lastLog.detalle || 'Sin detalle');
    
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
      colorEstado = 'var(--foreground)';
    }
  }

  const getOrigenColor = (origen) => {
    switch(origen) {
      case 'manual': return '#f59e0b'; // Naranja
      case 'masivo': return '#8b5cf6'; // Púrpura
      case 'motor':
      default: return '#10b981'; // Verde
    }
  };

  const chartData = {
    labels: historyLogs.map(log => new Date(log.created_at).toLocaleDateString('es-AR')),
    datasets: [
      {
        label: 'Evolución de Precio ($)',
        data: historyLogs.map(log => Number(log.precio_nuevo)),
        borderColor: '#10b981', // Línea general verde
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 3,
        fill: true,
        tension: 0.1,
        pointRadius: 6,
        pointBackgroundColor: historyLogs.map(log => getOrigenColor(log.origen)),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  };

  if (selectedProduct && historyLogs.length === 0) {
    chartData.labels = [new Date().toLocaleDateString('es-AR')];
    chartData.datasets[0].data = [Number(selectedProduct.price)];
    chartData.datasets[0].pointBackgroundColor = ['#10b981'];
  }
`;

finalString = finalString.replace('  const fetchDashboardData = async () => {', stateInjection + '\n  const fetchDashboardData = async () => {');

// Fix imports
finalString = finalString.replace(/import \{.*?\} from 'lucide-react';/, "import { Activity, AlertTriangle, ChevronRight, ChevronLeft, CreditCard, DollarSign, Edit, Globe, Info, Package, Play, Search, ShoppingBag, Trash2, TrendingUp, Users, RefreshCw, Calendar, History } from 'lucide-react';\nimport Select from 'react-select';");

fs.writeFileSync(path, finalString);
console.log("Successfully rebuilt ALL sections!");
