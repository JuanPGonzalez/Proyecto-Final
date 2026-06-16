const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminOrders.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add searchQuery and location states
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

// 2. Update useEffect to listen to searchQuery, but debounce might be needed. Let's just use a submit button or simple fetch.
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

// 3. Update fetchOrders params
code = code.replace(
  `params: { page: currentPage, limit: 8, status: statusFilter, sortBy }`,
  `params: { page: currentPage, limit: 8, status: statusFilter, sortBy, search: searchQuery }`
);

// 4. Add the search bar in the UI
const filterOld = `      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
        <select className="input-field" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: '220px' }}>`;

const filterNew = `      <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
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
        <select className="input-field" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ width: '220px' }}>`;

code = code.replace(filterOld, filterNew);

// Make sure Search is imported from lucide-react if not already
if (!code.includes('Search,')) {
  code = code.replace('Package,', 'Package, Search,');
}

fs.writeFileSync(path, code);
console.log("AdminOrders.jsx successfully updated!");
