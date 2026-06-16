const fs = require('fs');
const path = 'c:/Users/Juampo/Documents/GitHub/Proyecto-Final/frontend/src/pages/AdminDashboard.jsx';

let code = fs.readFileSync(path, 'utf8');

// The file got messed up at the end with stray code.
// Let's first clean any text after the component's closing bracket.
const endOfComponent = code.indexOf('\n  );\n}\n');
if (endOfComponent > -1) {
    code = code.substring(0, endOfComponent + 8);
}

// Now we need to restructure it perfectly.
// To avoid messy regex, we'll extract the core structure.
// Wait, actually, the easiest way to fix it is to restore from git? No, I don't want to lose the other changes.
// I'll just write the correct layout using replace_file_content.
// Since my script is running inside Node, let's just create a completely new file and overwrite.
