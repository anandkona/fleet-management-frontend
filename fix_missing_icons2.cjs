const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let changedFiles = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // The regex to fix the broken onClick arrow functions:
  // onClick={([^=]+)=\s*sx=(\{\{\s*bgcolor:\s*'[^']+',\s*color:\s*'[^']+',\s*'&:hover':\s*\{\s*bgcolor:\s*'[^']+'\s*\}\s*\}\})\s*>\s*([^\}]+)\}\s*>?
  
  const regex = /onClick=\{([^=]+)=\s*sx=(\{\{\s*bgcolor:\s*'[^']+',\s*color:\s*'[^']+',\s*'&:hover':\s*\{\s*bgcolor:\s*'[^']+'\s*\}\s*\}\})\s*>\s*([^\}]+)\}\s*(>?)/g;
  
  content = content.replace(regex, (match, args, sxObj, body, trailingBracket) => {
    // If there was no trailing bracket matched, we shouldn't insert one.
    // If there was, we should insert one.
    // BUT wait, in the replacement `onClick={...} sx={...} >`, we are putting a `>`.
    // If trailingBracket is empty, it means there was no `>` (e.g. `handleEdit(d)}<EditIcon`).
    // If it's just `<EditIcon`, we should NOT add `>`. We should add `>` ONLY if trailingBracket is `>`.
    return `onClick={${args.trim()} => ${body.trim()}} sx=${sxObj} ${trailingBracket ? '>' : ''}`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});
console.log('Fixed arrow functions in: ' + changedFiles.join(', '));
