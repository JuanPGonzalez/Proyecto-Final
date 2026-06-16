const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';

let code = fs.readFileSync(path, 'utf8');

// 1. Remove "Historial Completo de Ingresos" variable
code = code.replace(/const globalSalesChartData = \{[\s\S]*?\n  \};\n/, '');

// 2. Remove "Historial Completo de Ingresos" JSX
// We use a regex that safely matches the exact block.
const graphRegex = /<div className="card" style=\{\{ padding: '30px', marginBottom: '40px' \}\}>\s*<h4 style=\{\{ marginBottom: '25px', fontWeight: 800 \}\}>Historial Completo de Ingresos<\/h4>[\s\S]*?<\/div>\s*<\/div>\n/;
code = code.replace(graphRegex, '');

// 3. Fix useEffect dependency for historyFilters
code = code.replace(
  /  \}, \[historyFilters\]\);/g,
  '  }, [historyFilters, startDate, endDate]);'
);

// 4. Extract Sections to reorder them
// Look for exactly the start comments.
const sec1Comment = '{/* SECCIÓN 1: MÉTRICAS GENERALES (NO FILTRABLES) */}';
const sec2Comment = '{/* SECCIÓN 2: MÉTRICAS POR PERIODO */}';
const sec4Comment = '{/* SECCIÓN 4: HISTORIAL INTERACTIVO */}';
const secPriceComment = 'Historial de Precios por Producto</h3>'; // we'll find its parent <section>

const i1 = code.indexOf(sec1Comment);
const i2 = code.indexOf(sec2Comment);
const i4 = code.indexOf(sec4Comment);

// Find the start of the price section (the <section> tag above the h3)
const priceSectionStart = code.lastIndexOf('<section style={{ marginTop: \'60px\', marginBottom: \'60px\' }}>', code.indexOf(secPriceComment));

// Find the closing of the main component
const endReturn = code.lastIndexOf('  );\n}');
if (endReturn === -1) {
    // try CRLF
    const endReturnCRLF = code.lastIndexOf('  );\r\n}');
    if (endReturnCRLF !== -1) {
        // all good
    }
}

// Ensure all exist
if (i1 > -1 && i2 > -1 && i4 > -1 && priceSectionStart > -1) {
    const partTop = code.substring(0, i1);
    const sec1 = code.substring(i1, i2);
    const sec2 = code.substring(i2, i4);
    const sec4 = code.substring(i4, priceSectionStart);
    const secPriceAndEnd = code.substring(priceSectionStart);

    // Assembly: Top -> Sec2 -> Sec4 -> Sec1 -> Price
    // But rename the comments so it makes sense.
    let newSec2 = sec2.replace('SECCIÓN 2:', 'SECCIÓN 1:');
    let newSec4 = sec4.replace('SECCIÓN 4:', 'SECCIÓN 2:');
    let newSec1 = sec1.replace('SECCIÓN 1:', 'SECCIÓN 3:');

    const finalCode = partTop + newSec2 + newSec4 + newSec1 + secPriceAndEnd;
    
    fs.writeFileSync(path, finalCode);
    console.log("Successfully fixed layout");
} else {
    console.log("Error finding sections");
}
