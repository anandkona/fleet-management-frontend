const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      content = content.replace(/backgroundColor:\s*'#18181c'/g, "bgcolor: 'background.paper'");
      content = content.replace(/bgcolor:\s*'#18181c'/g, "bgcolor: 'background.paper'");
      
      content = content.replace(/backgroundColor:\s*'#1e1e24'/g, "bgcolor: 'background.paper'");
      content = content.replace(/bgcolor:\s*'#1e1e24'/g, "bgcolor: 'background.paper'");
      
      content = content.replace(/backgroundColor:\s*'#1b1b1f'/g, "bgcolor: 'background.paper'");
      content = content.replace(/bgcolor:\s*'#1b1b1f'/g, "bgcolor: 'background.paper'");

      content = content.replace(/backgroundColor:\s*'#121212'/g, "bgcolor: 'background.default'");
      
      content = content.replace(/border:\s*'1px solid #2a2a30'/g, "border: '1px solid', borderColor: 'divider'");
      content = content.replace(/borderBottom:\s*'1px solid #2a2a30'/g, "borderBottom: '1px solid', borderColor: 'divider'");
      content = content.replace(/borderTop:\s*'1px solid #2a2a30'/g, "borderTop: '1px solid', borderColor: 'divider'");
      content = content.replace(/borderRight:\s*'1px solid #2a2a30'/g, "borderRight: '1px solid', borderColor: 'divider'");
      content = content.replace(/borderLeft:\s*'1px solid #2a2a30'/g, "borderLeft: '1px solid', borderColor: 'divider'");
      content = content.replace(/borderColor:\s*'#2a2a30'/g, "borderColor: 'divider'");
      
      content = content.replace(/bgcolor:\s*'#2a2a30'/g, "bgcolor: 'divider'");

      content = content.replace(/color:\s*'#fff'/g, "color: 'text.primary'");

      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir('d:/fleet-management1/src/fleet');
processDir('d:/fleet-management1/src/components');
console.log('Done refactoring colors.');
