const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsx')) results.push(file);
    }
  });
  return results;
}

const files = [...walk('frontend/src'), ...walk('backend/services')];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('.toLocaleString()')) {
    content = content.replace(/\.toLocaleString\(\)/g, ".toLocaleString('es-AR')");
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});
