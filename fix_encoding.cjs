const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;
      if (content.includes('â‚¹')) {
        content = content.replace(/â‚¹/g, '₹');
        modified = true;
      }
      if (content.includes('â€”')) {
        content = content.replace(/â€”/g, '—');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed encoding in', fullPath);
      }
    }
  }
}

replaceInDir('d:/fleet-management1/src/fleet/pages');
console.log('Encoding fix complete!');
