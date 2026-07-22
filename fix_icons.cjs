const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let changedFiles = [];

function removeProp(str, propName) {
  let idx = str.indexOf(propName + '=');
  if (idx === -1) return str;
  let before = str.substring(0, idx);
  let rest = str.substring(idx + propName.length + 1);
  let char = rest[0];
  if (char === '"' || char === "'") {
    let end = rest.indexOf(char, 1);
    if (end === -1) return str;
    return before + rest.substring(end + 1);
  } else if (char === '{') {
    let count = 0;
    let end = 0;
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '{') count++;
      if (rest[i] === '}') count--;
      if (count === 0) {
        end = i;
        break;
      }
    }
    return before + rest.substring(end + 1);
  }
  return str;
}

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Use \s\S to match across newlines and > characters inside the IconButton attributes
  const regex = /<IconButton([\s\S]*?)>\s*sx=\{\{\s*bgcolor:\s*'([^']+)',\s*color:\s*'([^']+)',\s*'&:hover':\s*\{\s*bgcolor:\s*'([^']+)'\s*\}\s*\}\}>\s*<([A-Za-z]+)\s*sx=\{\{\s*fontSize:\s*17\s*\}\}([\s\S]*?)<\/IconButton>/g;
  
  content = content.replace(regex, (match, attrs, bg1, col, bg2, icon, iconAttrs) => {
    // Check if we matched too much
    if (attrs.includes('<IconButton') || iconAttrs.includes('IconButton>')) return match;

    let cleanAttrs = attrs;
    while (cleanAttrs.includes('sx=')) {
      cleanAttrs = removeProp(cleanAttrs, 'sx');
    }
    while (cleanAttrs.includes('color=')) {
      cleanAttrs = removeProp(cleanAttrs, 'color');
    }
    if (!cleanAttrs.endsWith(' ') && !cleanAttrs.endsWith('\n')) cleanAttrs += ' ';
    
    return `<IconButton${cleanAttrs}sx={{ bgcolor: '${bg1}', color: '${col}', '&:hover': { bgcolor: '${bg2}' } }}>\n<${icon} sx={{ fontSize: 17 }}${iconAttrs}</IconButton>`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});

console.log('Fixed files: ' + changedFiles.join(', '));
