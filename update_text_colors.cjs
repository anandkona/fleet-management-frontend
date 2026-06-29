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

      // Replace various shades of gray/light text with text.primary
      content = content.replace(/color:\s*'#8a8a93'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'#a1a1aa'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'#88888c'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'#888'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'#aaa'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'#75757a'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'#b3b3b8'/gi, "color: 'text.primary'");
      content = content.replace(/color:\s*'text.secondary'/gi, "color: 'text.primary'");
      
      // Also catch any color inside rgba if needed, but hex is most common here
      content = content.replace(/color:\s*'rgba\(255,255,255,0\.\d+\)'/g, "color: 'text.primary'");

      if (original !== content) {
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}

processDir('d:/fleet-management1/src/fleet');
processDir('d:/fleet-management1/src/components');
console.log('Done updating text colors.');
