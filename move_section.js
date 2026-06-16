const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'AdminDashboard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find section 4
const section4StartStr = "{/* SECCIÓN 4: HISTORIAL INTERACTIVO */}";
const section5StartStr = "{/* SECCIÓN 5: MOTOR DE PRICING Y DEMANDA */}";

const idx4 = content.indexOf(section4StartStr);
const idx5 = content.indexOf(section5StartStr);

if (idx4 === -1 || idx5 === -1) {
  console.log("Could not find sections");
  process.exit(1);
}

const section4Content = content.slice(idx4, idx5);

// Remove section 4 from original place
content = content.slice(0, idx4) + content.slice(idx5);

// Find end of section 1
const section2StartStr = "{/* SECCIÓN 2: MÉTRICAS GENERALES */}";
const idx2 = content.indexOf(section2StartStr);

if (idx2 === -1) {
  console.log("Could not find section 2");
  process.exit(1);
}

// Insert before section 2
content = content.slice(0, idx2) + section4Content + "\n      " + content.slice(idx2);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Moved section successfully");
