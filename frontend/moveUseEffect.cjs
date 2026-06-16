const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';
let code = fs.readFileSync(path, 'utf8');

const ue1StartStr = `  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');`;

const ue2EndStr = `  }, [historyFilters, startDate, endDate]);`;

const ue1Start = code.indexOf(ue1StartStr);
const ue2End = code.indexOf(ue2EndStr) + ue2EndStr.length;

if (ue1Start !== -1 && code.indexOf(ue2EndStr) !== -1) {
  const ueStr = code.slice(ue1Start, ue2End);
  code = code.slice(0, ue1Start) + code.slice(ue2End);
  const insertIdx = code.indexOf('  const handleFilter = (e) => {');
  if (insertIdx !== -1) {
    code = code.slice(0, insertIdx) + ueStr + '\n\n' + code.slice(insertIdx);
    fs.writeFileSync(path, code);
    console.log('Successfully moved useEffect below functions!');
  } else {
    console.log('Could not find insert point!');
  }
} else {
  console.log('Could not find useEffect blocks!');
}
