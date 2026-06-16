const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';

let code = fs.readFileSync(path, 'utf8');

// Use string matching based on prefixes
const sec1Start = code.indexOf('{/* SECCIÓN 1: MÉTRICAS POR PERIODO */}');
const sec4Start = code.indexOf('{/* SECCIÓN 4: HISTORIAL INTERACTIVO */}');
const histPreciosStart = code.indexOf('<section style={{ marginTop: \'60px\', marginBottom: \'60px\' }}>\r\n      <div style={{ display: \'flex\', alignItems: \'center\', gap: \'15px\', marginBottom: \'25px\', flexWrap: \'wrap\' }}>\r\n        <TrendingUp size={24} color="var(--primary)" />');
const endReturn = code.indexOf('  );\r\n}');
const sec2Start = code.indexOf('{/* SECCIÓN 2: MÉTRICAS GENERALES');

if (sec1Start > -1 && sec4Start > -1 && histPreciosStart > -1 && endReturn > -1 && sec2Start > -1) {
    const partTop = code.substring(0, sec1Start);
    const partSec1 = code.substring(sec1Start, sec4Start);
    const partSec4 = code.substring(sec4Start, histPreciosStart);
    const partHistPrecios = code.substring(histPreciosStart, endReturn);
    
    // sec2 is stranded at the end
    // actually let's find exactly where sec2 ends. It's the end of the file.
    const partSec2 = code.substring(sec2Start);
    
    // Remove any trailing spaces or closing tags from partSec2
    // partSec2 is just a section block.
    
    // Assembly
    const finalCode = 
        partTop + 
        partSec1 + 
        partSec4 + 
        partSec2 + '\n\n' +
        partHistPrecios + 
        '  );\n}\n';

    fs.writeFileSync(path, finalCode);
    console.log("Successfully rebuilt AdminDashboard with CRLF fix!");
} else {
    console.log("Failed to find index");
}
