const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'const fetchDashboardData = async () => {',
  'async function fetchDashboardData() {'
);

code = code.replace(
  'const fetchSupportData = async () => {',
  'async function fetchSupportData() {'
);

code = code.replace(
  'const fetchUsers = async () => {',
  'async function fetchUsers() {'
);

code = code.replace(
  'const fetchPurchaseHistory = async () => {',
  'async function fetchPurchaseHistory() {'
);

fs.writeFileSync(path, code);
console.log('Fixed hoisted functions!');
