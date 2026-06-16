const fs = require('fs');

const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove Global Sales Chart Data definition
code = code.replace(/const globalSalesChartData = \{[\s\S]*?\}\s*\}\s*\};\s*/, '');

// 2. Remove Global Sales Chart UI
code = code.replace(/<div className="card" style=\{\{ padding: '30px', marginBottom: '40px' \}\}>\s*<h4 style=\{\{ marginBottom: '25px', fontWeight: 800 \}\}>Historial Completo de Ingresos<\/h4>[\s\S]*?<\/div>\s*<\/div>/, '');

// 3. Fix History useEffect
code = code.replace(
  /  \}, \[historyFilters\]\);/g,
  '  }, [historyFilters, startDate, endDate]);'
);

// 4. Extract sections
const s1Start = code.indexOf('{/* SECCIÓN 1: MÉTRICAS GENERALES');
const s2Start = code.indexOf('{/* SECCIÓN 2: MÉTRICAS POR PERIODO');
const s3Start = code.indexOf('{/* SECCIÓN 3: RENDIMIENTO DEL MOTOR');
const s4Start = code.indexOf('{/* SECCIÓN 4: HISTORIAL INTERACTIVO');
const priceStart = code.indexOf('{/* SECCIÓN 5: MOTOR DE PRICING');

if (s1Start > -1 && s2Start > -1 && s3Start > -1 && s4Start > -1 && priceStart > -1) {
  const top = code.substring(0, s1Start);
  const sec1 = code.substring(s1Start, s2Start);
  const sec2 = code.substring(s2Start, s3Start);
  const sec3 = code.substring(s3Start, s4Start); // Not used if we want to remove pricing motor UI, wait, the user said "el boton de ejecutar el motor de pricing automatico eliminalo. Vamos a refeactorizar el grafico de historial de precio". 
  const sec4 = code.substring(s4Start, priceStart);
  
  // Wait, origin/main has the old SECCIÓN 5 which has the "ejecutar motor" button!
  // I must replace it with the new Historial de Precios graph completely!
  
  // Let's replace the top with our new order: Top -> sec2 -> sec4 -> sec1 -> new price history
}
