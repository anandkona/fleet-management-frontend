const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

let changedFiles = 0;
files.forEach(file => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  const original = content;

  let parts = content.split('<IconButton');
  for (let i = 1; i < parts.length; i++) {
    let endIdx = parts[i].indexOf('</IconButton>');
    if (endIdx !== -1) {
      let buttonContent = parts[i].substring(0, endIdx);
      if (buttonContent.includes('<Edit ') || buttonContent.includes('<Edit>')) {
        parts[i] = parts[i].substring(0, endIdx).replace(/#f59e0b/g, '#3b82f6') + parts[i].substring(endIdx);
      }
    }
  }

  content = parts.join('<IconButton');

  if (content !== original) {
    fs.writeFileSync(p, content);
    changedFiles++;
    console.log('Updated ' + file);
  }
});

console.log(`Updated Edit icon colors in ${changedFiles} additional files.`);
