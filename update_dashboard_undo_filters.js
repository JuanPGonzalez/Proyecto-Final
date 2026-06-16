const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove startDate, endDate
content = content.replace("  const [startDate, setStartDate] = useState('');\n  const [endDate, setEndDate] = useState('');\n", "");

// 2. Replace fetchPriceHistory and useEffect with handleProductSelect
const fetchBlock = \`  const fetchPriceHistory = async () => {
    if (!selectedProduct) {
      setHistoryLogs([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await axios.get(\\\`http://localhost:5000/api/products/\\\${selectedProduct.value || selectedProduct.id}/price-history\\\`, {
        headers: { Authorization: \\\`Bearer \\\${token}\\\` },
        params
      });
      setHistoryLogs(res.data.logs);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, [selectedProduct]);

  const handleProductSelect = (selectedOption) => {
    setSelectedProduct(selectedOption);
  };\`;

const newFetchBlock = \`  const handleProductSelect = async (selectedOption) => {
    if (!selectedOption) {
      setSelectedProduct(null);
      setHistoryLogs([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(\\\`http://localhost:5000/api/products/\\\${selectedOption.value || selectedOption.id}/price-history\\\`, {
        headers: { Authorization: \\\`Bearer \\\${token}\\\` }
      });
      setSelectedProduct(res.data.product);
      // Solo mostrar los ultimos 7 movimientos
      setHistoryLogs(res.data.logs.slice(-7));
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  };\`;

content = content.replace(fetchBlock, newFetchBlock);

// 3. Revert the select + date inputs to just the select
const inputsBlockStart = content.indexOf('            <div style={{ display: \\'flex\\', gap: \\'20px\\', alignItems: \\'flex-end\\', marginBottom: \\'30px\\', flexWrap: \\'wrap\\' }}>');
const inputsBlockEnd = content.indexOf('        </div>\\n\\n        {loading ? (', inputsBlockStart);

if (inputsBlockStart !== -1 && inputsBlockEnd !== -1) {
  const originalSelect = \`        <div style={{ marginBottom: '30px', maxWidth: '600px' }}>
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
                    <span style={{ fontWeight: 600 }}>{option.name}</span>
                    {option.Category && <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>{option.Category.descripcion}</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>\\\${Number(option.price).toLocaleString('es-AR')}</span>
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
          />\`;
  content = content.substring(0, inputsBlockStart) + originalSelect + content.substring(inputsBlockEnd);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
