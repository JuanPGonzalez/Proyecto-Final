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

// 2. Update useEffect to listen to searchQuery
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

// Make sure Search is imported from lucide-react if not already
if (!code.includes('Search,')) {
  code = code.replace('Package,', 'Package, Search,');
}

fs.writeFileSync(path, code);
console.log("AdminOrders.jsx successfully updated initial states!");
