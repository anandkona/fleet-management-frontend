const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let changedFiles = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const replaceIcon = (iconName, colorStr) => {
    // Non-greedy match for the inside of IconButton before the Icon
    const regex = new RegExp(`<IconButton([\\s\\S]*?)<${iconName}(?:Icon)?([\\s\\S]*?)<\\/IconButton>`, 'g');
    content = content.replace(regex, (match, attrs1, attrs2) => {
      // Sanity check: don't cross multiple IconButtons
      if (attrs1.includes('<IconButton') || attrs2.includes('<IconButton')) return match;

      // Clean up old styles
      let newAttrs1 = attrs1.replace(/sx=\\{[^}]*\\}/g, '').replace(/color="[^"]+"/g, '');
      let newAttrs2 = attrs2.replace(/fontSize="[^"]+"/g, '').replace(/sx=\\{[^}]*\\}/g, '');

      // Ensure space before sx
      if (!newAttrs1.endsWith(' ') && !newAttrs1.endsWith('\n')) newAttrs1 += ' ';

      return `<IconButton${newAttrs1}sx={{ bgcolor: '${colorStr}15', color: '${colorStr}', '&:hover': { bgcolor: '${colorStr}30' } }}>\n<${iconName} sx={{ fontSize: 17 }}${newAttrs2}</IconButton>`;
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
  replaceIcon('Receipt', '#6366f1'); // Just in case
  replaceIcon('Print', '#64748b'); // Just in case

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});

console.log('Changed files: ' + changedFiles.join(', '));
