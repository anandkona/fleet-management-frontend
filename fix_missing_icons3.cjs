const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let changedFiles = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Find onClick handlers that were broken because their bodies contained a '}' (like an object literal).
  // Example broken format: onClick={() => setViewDialog({ open: true, doc: r} sx={{ bgcolor: ... }} )} >
  
  const regex = /onClick=\{([^=]+)=>\s*(.*?)\}\s*sx=(\{\{\s*bgcolor:\s*'[^']+',\s*color:\s*'[^']+',\s*'&:hover':\s*\{\s*bgcolor:\s*'[^']+'\s*\}\s*\}\})\s*([)\}][^>]*>?)/g;
  
  content = content.replace(regex, (match, args, body, sxObj, remainder) => {
    let innerRemainder = remainder.replace(/\s*>?$/, '');
    let hasTrailing = remainder.includes('>');
    return `onClick={${args.trim()} => ${body}${innerRemainder}} sx=${sxObj} ${hasTrailing ? '>' : ''}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});
console.log('Fixed broken onClick objects in: ' + changedFiles.join(', '));
