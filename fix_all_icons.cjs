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
      let btnContent = parts[i].substring(0, endIdx);
      
      let newSx = null;
      let iconSize = ' sx={{ fontSize: 17 }} ';
      
      if (btnContent.includes('<Visibility') || btnContent.includes('<VisibilityIcon')) {
        newSx = `sx={{ bgcolor: '#3b82f615', color: '#3b82f6', '&:hover': { bgcolor: '#3b82f630' } }}`;
      } else if (btnContent.includes('<Download') || btnContent.includes('<DownloadIcon')) {
        newSx = `sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', '&:hover': { bgcolor: '#8b5cf630' } }}`;
      } else if (btnContent.includes('<VerifiedUser') || btnContent.includes('<CheckCircle') || btnContent.includes('<VerifiedUserIcon')) {
        newSx = `sx={{ bgcolor: '#10b98115', color: '#10b981', '&:hover': { bgcolor: '#10b98130' } }}`;
      } else if (btnContent.includes('<ThumbDown') || btnContent.includes('<ThumbDownIcon')) {
        newSx = `sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}`;
      } else if (btnContent.includes('<Delete') || btnContent.includes('<DeleteIcon')) {
        newSx = `sx={{ bgcolor: '#ef444415', color: '#ef4444', '&:hover': { bgcolor: '#ef444430' } }}`;
      }

      if (newSx) {
        // Replace existing sx={...} if present
        let match = btnContent.match(/sx=\{\{.*?\}\}/s);
        if (match) {
          btnContent = btnContent.replace(match[0], newSx);
        } else {
          // insert it after the first space or before the >
          btnContent = btnContent.replace('>', ` ${newSx}>`);
        }
        
        // Ensure icon has sx={{ fontSize: 17 }} and NOT fontSize="small"
        btnContent = btnContent.replace(/fontSize="small"/g, 'sx={{ fontSize: 17 }} ');
        
        parts[i] = btnContent + parts[i].substring(endIdx);
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

console.log(`Updated icons in ${changedFiles} files.`);
