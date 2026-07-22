const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let changedFiles = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Regex to match <IconButton ...> ... <Icon .../> ... </IconButton>
  // This is a bit complex due to nested elements potentially, but usually it's just the icon or Tooltip > IconButton > Icon
  // Since we know the exact format we want to enforce:
  
  const replaceIcon = (iconName, colorStr) => {
    // Find <IconButton ...><IconName .../></IconButton>
    const regex = new RegExp(`<IconButton([^>]*)>\\s*<${iconName}(Icon)?([^>]*)>\\s*</IconButton>`, 'g');
    content = content.replace(regex, (match, attrs1, icon, attrs2) => {
      // Remove existing sx and color from IconButton
      let newAttrs1 = attrs1.replace(/sx=\\{[^}]+\\}/g, '').replace(/color="[^"]+"/g, '');
      // Remove existing fontSize from Icon
      let newAttrs2 = attrs2.replace(/fontSize="[^"]+"/g, '').replace(/sx=\\{[^}]+\\}/g, '');
      
      return `<IconButton${newAttrs1} sx={{ bgcolor: '${colorStr}15', color: '${colorStr}', '&:hover': { bgcolor: '${colorStr}30' } }}><${iconName}${icon || ''} sx={{ fontSize: 17 }}${newAttrs2} /></IconButton>`;
    });
  };

  replaceIcon('Visibility', '#3b82f6');
  replaceIcon('Edit', '#f59e0b');
  replaceIcon('Delete', '#ef4444');
  replaceIcon('CheckCircle', '#10b981');
  replaceIcon('VerifiedUser', '#10b981');
  replaceIcon('Download', '#8b5cf6');
  replaceIcon('ThumbDown', '#ef4444');
  replaceIcon('Cancel', '#f97316');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});

console.log('Changed files: ' + changedFiles.join(', '));
