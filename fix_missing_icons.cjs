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

  const btnRegex = /<IconButton([^>]*)>([\s\S]*?)<\/IconButton>/g;
  
  content = content.replace(btnRegex, (match, attrs, inner) => {
    if (attrs.includes('bgcolor:')) return match;
    
    let colorStr = null;
    let iconNameMatch = inner.match(/<([A-Za-z]+(?:Icon|Outlined)?)\s*/);
    if (!iconNameMatch) return match;
    
    const rawIcon = iconNameMatch[1];
    const iconName = rawIcon.replace(/Icon$/, '').replace(/Outlined$/, '').replace(/Outline$/, '');
    
    if (iconName === 'Visibility') colorStr = '#3b82f6';
    else if (iconName === 'Edit') colorStr = '#f59e0b';
    else if (iconName === 'Delete') colorStr = '#ef4444';
    else if (iconName === 'CheckCircle' || iconName === 'VerifiedUser') colorStr = '#10b981';
    else if (iconName === 'Download') colorStr = '#8b5cf6';
    else if (iconName === 'ThumbDown') colorStr = '#ef4444';
    else if (iconName === 'Cancel') colorStr = '#f97316';
    else if (iconName === 'Receipt') colorStr = '#6366f1';
    else if (iconName === 'Print') colorStr = '#64748b';
    
    if (!colorStr) return match;
    
    let cleanAttrs = attrs;
    while (cleanAttrs.includes('sx=')) cleanAttrs = removeProp(cleanAttrs, 'sx');
    while (cleanAttrs.includes('color=')) cleanAttrs = removeProp(cleanAttrs, 'color');
    if (!cleanAttrs.endsWith(' ') && !cleanAttrs.endsWith('\n')) cleanAttrs += ' ';
    
    let cleanInner = inner;
    while (cleanInner.includes('sx=')) cleanInner = removeProp(cleanInner, 'sx');
    while (cleanInner.includes('fontSize=')) cleanInner = removeProp(cleanInner, 'fontSize');
    
    cleanInner = cleanInner.replace(new RegExp(`<${rawIcon}`), `<${rawIcon} sx={{ fontSize: 17 }} `);
    
    return `<IconButton${cleanAttrs}sx={{ bgcolor: '${colorStr}15', color: '${colorStr}', '&:hover': { bgcolor: '${colorStr}30' } }}>${cleanInner}</IconButton>`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});
console.log('Fixed missing icons in: ' + changedFiles.join(', '));
