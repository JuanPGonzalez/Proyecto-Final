const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Move SECCIÓN 4 to before SECCIÓN 2
const s4Start = content.indexOf('{/* SECCIÓN 4: HISTORIAL INTERACTIVO */}');
const s5Start = content.indexOf('{/* SECCIÓN 5: MOTOR DE PRICING Y DEMANDA */}');
if (s4Start !== -1 && s5Start !== -1) {
  const section4 = content.substring(s4Start, s5Start);
  content = content.substring(0, s4Start) + content.substring(s5Start);
  
  const s2Start = content.indexOf('{/* SECCIÓN 2: MÉTRICAS GENERALES */}');
  content = content.substring(0, s2Start) + section4 + '\n      ' + content.substring(s2Start);
}

// 2. Move "Top Clientes" & "Productos Más Vendidos" from SECCIÓN 2 to SECCIÓN 1
// It's a div starting with <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
// and ending before </section> of SECCIÓN 2
const topClientsStr = "<div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>\n          <div className=\"card\" style={{ padding: '30px' }}>\n             <h4 style={{ marginBottom: '25px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}><Award color=\"#f59e0b\" /> Top Clientes</h4>";

const topClientsIdx = content.indexOf(topClientsStr);
if (topClientsIdx !== -1) {
  // Find the end of this grid which is before the </section> of SECCIÓN 2
  const sec2EndIdx = content.indexOf('</section>', topClientsIdx);
  const blockToMove = content.substring(topClientsIdx, sec2EndIdx);
  content = content.substring(0, topClientsIdx) + content.substring(sec2EndIdx);

  // Insert into SECCIÓN 1
  // Find the end of SECCIÓN 1
  const sec1EndIdx = content.indexOf('</section>', content.indexOf('{/* SECCIÓN 1: MÉTRICAS POR PERIODO */}'));
  content = content.substring(0, sec1EndIdx) + blockToMove + '\n      ' + content.substring(sec1EndIdx);
}

// 3. Update PricingHistorySection
// Change Title
content = content.replace(
  '<h3 style={{ margin: 0, fontSize: \'1.6rem\', fontWeight: 800 }}>Motor de Pricing Automático</h3>',
  '<h3 style={{ margin: 0, fontSize: \'1.6rem\', fontWeight: 800 }}>Historial de Precios</h3>'
);

// Add states
content = content.replace(
  'const [loading, setLoading] = useState(false);',
  'const [loading, setLoading] = useState(false);\n  const [startDate, setStartDate] = useState(\'\');\n  const [endDate, setEndDate] = useState(\'\');'
);

// Update fetch
const fetchPriceOriginal = `  const handleProductSelect = async (selectedOption) => {
    if (!selectedOption) {
      setSelectedProduct(null);
      setHistoryLogs([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(\`http://localhost:5000/api/products/\${selectedOption.value}/price-history\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      setSelectedProduct(res.data.product);
      setHistoryLogs(res.data.logs);
    } catch (error) {
      console.error("Error fetching price history:", error);
    } finally {
      setLoading(false);
    }
  };`;

const fetchPriceNew = `  const fetchPriceHistory = async () => {
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
      const res = await axios.get(\`http://localhost:5000/api/products/\${selectedProduct.value || selectedProduct.id}/price-history\`, {
        headers: { Authorization: \`Bearer \${token}\` },
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
  };`;

content = content.replace(fetchPriceOriginal, fetchPriceNew);

// Add Date inputs
const inputHtml = `
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', fontWeight: 700 }}>Desde:</label>
              <input type="date" className="input-field" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ height: '45px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', fontWeight: 700 }}>Hasta:</label>
              <input type="date" className="input-field" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ height: '45px' }} />
            </div>
            <button className="btn" onClick={fetchPriceHistory} style={{ height: '45px', padding: '0 20px', fontWeight: 700 }} disabled={!selectedProduct}>
              Filtrar
            </button>
          </div>
`;

content = content.replace('menuPortalTarget={document.body}\n          />\n        </div>', 'menuPortalTarget={document.body}\n          />\n' + inputHtml + '\n        </div>');

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboard.jsx updated successfully');
