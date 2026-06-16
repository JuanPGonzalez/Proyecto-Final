const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';

let code = fs.readFileSync(path, 'utf8');

// 1. Move SECCIÓN 4 (Historial de compras) inside SECCIÓN 1 (Métricas por periodo)
const s1Start = code.indexOf('{/* SECCIÓN 1: MÉTRICAS POR PERIODO */}');
const s2Start = code.indexOf('{/* SECCIÓN 2: MÉTRICAS GENERALES (NO FILTRABLES) */}');
const s4Start = code.indexOf('{/* SECCIÓN 4: HISTORIAL INTERACTIVO */}');
const s5Start = code.indexOf('{/* SECCIÓN 5: MOTOR DE PRICING */}'); // Let's check what the last section is. Wait, it's Histórico de Precios.

if (s1Start > -1 && s2Start > -1 && s4Start > -1) {
    let s4End = s5Start > -1 ? s5Start : code.length;
    // Find the end of section 4 precisely
    const section4Code = code.substring(s4Start, s4End);
    
    // We want to remove section4Code from its current place and insert it BEFORE s2Start
    code = code.replace(section4Code, '');
    
    // Recalculate s2Start
    const newS2Start = code.indexOf('{/* SECCIÓN 2: MÉTRICAS GENERALES (NO FILTRABLES) */}');
    
    const before = code.substring(0, newS2Start);
    const after = code.substring(newS2Start);
    
    code = before + section4Code + '\n\n' + after;
}

// 2. Add startDate and endDate to the useEffect that calls fetchPurchaseHistory
code = code.replace(
  /  \}, \[historyFilters\]\);/g,
  '  }, [historyFilters, startDate, endDate]);'
);

// 3. Add date filters to "Historial de precios por producto"
// We need to add state variables for price history dates, and inputs.
// Let's check where the price history is defined.
// Actually, it's better to do step 1 and 2 first.

fs.writeFileSync(path, code);
console.log('Successfully updated AdminDashboard part 1');
