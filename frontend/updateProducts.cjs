const fs = require('fs');

const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminProducts.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Fetch includeInactive=true
code = code.replace(
  "axios.get('http://localhost:5000/api/products', {",
  "axios.get('http://localhost:5000/api/products?includeInactive=true', {"
);

// 2. Add inactive option
code = code.replace(
  '<option value="out_of_stock">Sin Stock</option>',
  '<option value="out_of_stock">Sin Stock</option>\n            <option value="inactive">Dados de baja</option>'
);

// 3. Filter logic update
const filterOld = `    let matchesStockStatus = true;
    if (stockStatus === 'in_stock') matchesStockStatus = p.stock > 0;
    if (stockStatus === 'low_stock') matchesStockStatus = p.stock > 0 && p.stock < 5;
    if (stockStatus === 'out_of_stock') matchesStockStatus = p.stock === 0;`;

const filterNew = `    let matchesStockStatus = true;
    if (stockStatus === 'in_stock') matchesStockStatus = p.stock > 0 && p.isActive !== false;
    if (stockStatus === 'low_stock') matchesStockStatus = p.stock > 0 && p.stock < 5 && p.isActive !== false;
    if (stockStatus === 'out_of_stock') matchesStockStatus = p.stock === 0 && p.isActive !== false;
    if (stockStatus === 'inactive') matchesStockStatus = p.isActive === false;
    else if (stockStatus === 'all') matchesStockStatus = p.isActive !== false; // Only show active products if 'Todos' is selected`;

code = code.replace(filterOld, filterNew);

// 4. Add handleReactivate method before clearFilters
const handleReactivateCode = `
  const handleReactivate = async (id) => {
    const confirm = await showConfirm('¿Restaurar producto?', 'Este producto volverá a estar visible en la tienda.', 'Sí, restaurar');
    if (!confirm.isConfirmed) return;
    try {
      await axios.patch(\`http://localhost:5000/api/products/\${id}/reactivate\`, {}, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      showToast('Producto restaurado correctamente', 'success');
      fetchProducts();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Error al restaurar', 'error');
    }
  };
`;
code = code.replace('  const clearFilters = () => {', handleReactivateCode + '\n  const clearFilters = () => {');

// 5. Add Reactivate button next to Edit/Delete in table
// The table rendering for actions looks like this:
// <td style={{ padding: '15px' }}>
//   <div style={{ display: 'flex', gap: '10px' }}>
//     <button className="btn-icon" onClick={() => handleEdit(product)} title="Editar"><Edit2 size={18} /></button>
//     <button className="btn-icon delete" onClick={() => handleDelete(product.id)} title="Eliminar"><Trash2 size={18} /></button>
//   </div>
// </td>

const actionsOld = `<td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-icon" onClick={() => handleEdit(product)} title="Editar"><Edit2 size={18} /></button>
                        <button className="btn-icon delete" onClick={() => handleDelete(product.id)} title="Eliminar"><Trash2 size={18} /></button>
                      </div>
                    </td>`;

const actionsNew = `<td style={{ padding: '15px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {product.isActive === false ? (
                          <button className="btn-icon" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }} onClick={() => handleReactivate(product.id)} title="Restaurar"><RefreshCw size={18} /></button>
                        ) : (
                          <>
                            <button className="btn-icon" onClick={() => handleEdit(product)} title="Editar"><Edit2 size={18} /></button>
                            <button className="btn-icon delete" onClick={() => handleDelete(product.id)} title="Dar de baja"><Trash2 size={18} /></button>
                          </>
                        )}
                      </div>
                    </td>`;

code = code.replace(actionsOld, actionsNew);

// Since RefreshCw might not be imported from lucide-react in AdminProducts.jsx, we need to add it.
code = code.replace("import { Edit2, Trash2, Search, AlertTriangle, Filter, Activity, Download, Upload, Plus, TrendingUp } from 'lucide-react';", "import { Edit2, Trash2, Search, AlertTriangle, Filter, Activity, Download, Upload, Plus, TrendingUp, RefreshCw } from 'lucide-react';");

// 6. Highlight inactive rows
code = code.replace(
  /<tr key=\{product\.id\} style=\{\{ borderBottom:/,
  `<tr key={product.id} style={{ opacity: product.isActive === false ? 0.6 : 1, borderBottom:`
);

fs.writeFileSync(path, code);
console.log("AdminProducts.jsx successfully updated!");
