const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminOrders.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Initial setup
code = code.replace(
  `import { useNavigate } from 'react-router-dom';`,
  `import { useNavigate, useLocation } from 'react-router-dom';`
);

code = code.replace(
  `  const [generatingPdf, setGeneratingPdf] = useState(false);`,
  `  const [generatingPdf, setGeneratingPdf] = useState(false);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState(location.state?.searchUserId || '');`
);

code = code.replace(
  `  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) return navigate('/forbidden');
    fetchOrders();
  }, [currentPage, statusFilter, sortBy]);`,
  `  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !isAdminRole(user)) return navigate('/forbidden');
    fetchOrders();
  }, [currentPage, statusFilter, sortBy, searchQuery]);`
);

code = code.replace(
  `params: { page: currentPage, limit: 8, status: statusFilter, sortBy }`,
  `params: { page: currentPage, limit: 8, status: statusFilter, sortBy, search: searchQuery }`
);

if (!code.includes('Search,')) {
  code = code.replace('Package,', 'Package, Search,');
}

// DOM Replacement
const markerStart = '<div style={{ display: \\'flex\\', gap: \\'15px\\', marginBottom: \\'25px\\' }}>';
const markerEnd = '</select>\\n      </div>';
const startIdx = code.indexOf(markerStart);
if (startIdx !== -1) {
  const endIdx = code.indexOf(markerEnd, startIdx) + markerEnd.length;
  
  const replacement = \`      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
           <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
           <input 
             type="text" 
             className="input-field" 
             placeholder="Buscar por ID de orden o Nombre de cliente..." 
             style={{ paddingLeft: '40px' }}
             value={searchQuery}
             onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
           />
        </div>
        <select className="input-field" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ width: '220px' }}>
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendientes (Efectivo/Tarjeta)</option>
          <option value="Pendiente de Validación">Por Validar (Transferencia)</option>
          <option value="En preparación">En preparación</option>
          <option value="Cerrada">Cerradas</option>
          <option value="Cancelada">Canceladas</option>
        </select>
      </div>\`;
      
  code = code.slice(0, startIdx) + replacement + code.slice(endIdx);
}

fs.writeFileSync(path, code);
console.log('Script ran!');
