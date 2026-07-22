const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

function removeProp(str, propName) {
  let idx = str.indexOf(propName + '=');
  if (idx === -1) return str;
  if (idx > 0 && /\w/.test(str[idx - 1])) return str; 
  
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

let changedFiles = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Typography cleanup
  if (['FinanceTransactionsPage.jsx', 'TripBillingPage.jsx', 'DriverAdvancesPage.jsx', 'PODBillingChainPage.jsx'].includes(file)) {
    content = content.replace(/<Chip\s+variant="outlined"\s+label=\{([^}]+)\}[^>]*\/>/g, 
      '<Typography variant="body2" sx={{ fontWeight: 500, color: \'text.primary\' }}>{$1}</Typography>'
    );
  }

  // 2. Safely find <IconButton ...> and </IconButton>
  let newContent = '';
  let i = 0;
  while (i < content.length) {
    let idx = content.indexOf('<IconButton', i);
    if (idx === -1) {
      newContent += content.substring(i);
      break;
    }
    newContent += content.substring(i, idx);
    
    // Find the end of the <IconButton tag
    let j = idx + '<IconButton'.length;
    let braceCount = 0;
    let inQuotes = false;
    let quoteChar = '';
    let tagEnded = false;
    
    for (; j < content.length; j++) {
      let c = content[j];
      if (inQuotes) {
        if (c === quoteChar) inQuotes = false;
      } else {
        if (c === '"' || c === "'") {
          inQuotes = true;
          quoteChar = c;
        } else if (c === '{') {
          braceCount++;
        } else if (c === '}') {
          braceCount--;
        } else if (c === '>' && braceCount === 0) {
          tagEnded = true;
          break;
        }
      }
    }
    
    if (!tagEnded) {
      newContent += content.substring(idx, j);
      i = j;
      continue;
    }
    
    let attrs = content.substring(idx + '<IconButton'.length, j);
    let endIdx = content.indexOf('</IconButton>', j);
    if (endIdx === -1) {
      newContent += content.substring(idx, j + 1);
      i = j + 1;
      continue;
    }
    
    let inner = content.substring(j + 1, endIdx);
    i = endIdx + '</IconButton>'.length;
    
    if (attrs.includes('bgcolor:')) {
      newContent += `<IconButton${attrs}>${inner}</IconButton>`;
      continue;
    }
    
    let colorStr = null;
    let iconNameMatch = inner.match(/<([A-Za-z]+(?:Icon|Outlined)?)\s*/);
    if (!iconNameMatch) {
      newContent += `<IconButton${attrs}>${inner}</IconButton>`;
      continue;
    }
    
    const rawIcon = iconNameMatch[1];
    const iconName = rawIcon.replace(/Icon$/, '').replace(/Outlined$/, '').replace(/Outline$/, '');
    
    if (iconName === 'Visibility') colorStr = '#3b82f6';
    else if (iconName === 'Edit') colorStr = '#f59e0b';
    else if (iconName === 'Delete') colorStr = '#ef4444';
    else if (iconName === 'CheckCircle' || iconName === 'VerifiedUser' || iconName === 'Check') colorStr = '#10b981';
    else if (iconName === 'Download' || iconName === 'CloudUpload' || iconName === 'FileUpload') colorStr = '#8b5cf6';
    else if (iconName === 'ThumbDown' || iconName === 'Cancel' || iconName === 'Close') colorStr = '#ef4444';
    else if (iconName === 'Receipt') colorStr = '#6366f1';
    else if (iconName === 'Print') colorStr = '#64748b';
    else if (iconName === 'Payment' || iconName === 'Payments') colorStr = '#10b981';
    else colorStr = '#64748b'; // default for others like Event, etc. if needed, but let's just color them all nicely
    
    let cleanAttrs = attrs;
    while (cleanAttrs.includes('sx=')) cleanAttrs = removeProp(cleanAttrs, 'sx');
    while (cleanAttrs.includes('color=')) cleanAttrs = removeProp(cleanAttrs, 'color');
    if (!cleanAttrs.endsWith(' ') && !cleanAttrs.endsWith('\n')) cleanAttrs += ' ';
    
    let cleanInner = inner;
    while (cleanInner.includes('sx=')) cleanInner = removeProp(cleanInner, 'sx');
    while (cleanInner.includes('fontSize=')) cleanInner = removeProp(cleanInner, 'fontSize');
    while (cleanInner.includes('color=')) cleanInner = removeProp(cleanInner, 'color');
    
    cleanInner = cleanInner.replace(new RegExp(`<${rawIcon}`), `<${rawIcon} sx={{ fontSize: 17 }}`);
    
    newContent += `<IconButton${cleanAttrs}sx={{ bgcolor: '${colorStr}15', color: '${colorStr}', '&:hover': { bgcolor: '${colorStr}30' } }}>${cleanInner}</IconButton>`;
  }

  if (newContent !== original) {
    fs.writeFileSync(filePath, newContent);
    changedFiles.push(file);
  }
});
console.log('Successfully updated: ' + changedFiles.join(', '));
