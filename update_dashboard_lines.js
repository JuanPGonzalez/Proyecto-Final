const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// 1. Move Top Clientes grid.
// Find grid start
let gridStart = -1;
let gridEnd = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Award color="#f59e0b"') && lines[i].includes('Top Clientes')) {
    // The <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
    // is 2 lines above
    gridStart = i - 2;
    break;
  }
}

// Find grid end. It ends before </section>
for (let i = gridStart; i < lines.length; i++) {
  if (lines[i].includes('</section>')) {
    gridEnd = i; // exclusive
    break;
  }
}

const gridLines = lines.slice(gridStart, gridEnd);
lines.splice(gridStart, gridEnd - gridStart);

// Insert into Section 1.
let sec1End = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('</section>') && i < 600) {
    sec1End = i;
    break;
  }
}

lines.splice(sec1End, 0, ...gridLines);

// Now update PricingHistorySection
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('function PricingHistorySection() {')) {
    // insert states
    for(let j = i; j < i + 20; j++) {
      if(lines[j].includes('const [loading, setLoading] = useState(false);')) {
        lines.splice(j + 1, 0, "  const [startDate, setStartDate] = useState('');", "  const [endDate, setEndDate] = useState('');");
        break;
      }
    }
  }

  // Replace handleProductSelect block with fetchPriceHistory and new handleProductSelect
  if (lines[i].includes('const handleProductSelect = async (selectedOption) => {')) {
    let funcEnd = -1;
    for(let j = i; j < i + 50; j++) {
      if(lines[j] === '  };') {
        funcEnd = j;
        break;
      }
    }
    const newFunc = \`  const fetchPriceHistory = async () => {
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
    lines.splice(i, funcEnd - i + 1, ...newFunc.split('\\n'));
  }

  // Update title
  if (lines[i].includes('Motor de Pricing Automático')) {
    lines[i] = lines[i].replace('Motor de Pricing Automático', 'Historial de Precios');
  }

  // Add inputs
  if (lines[i].includes('menuPortalTarget={document.body}')) {
    // skip the /> and </div> lines
    let divEnd = -1;
    for(let j = i; j < i + 5; j++) {
      if(lines[j].includes('</div>')) {
        divEnd = j;
        break;
      }
    }
    const inputs = \`        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '15px' }}>
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
        </div>\`;
    lines.splice(divEnd, 0, ...inputs.split('\\n'));
  }
}

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('Script done');
