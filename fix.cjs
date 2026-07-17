const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Match the broken icon+action pattern
  const brokenRegex = /icon=\{<([A-Za-z]+)\s+color=\"primary\"\s+sx=\{\{\s*fontSize:\s*40\s*\}\}\s*action=\{([\s\S]*?)\}\s*\/>\}\s*\/>/g;
  if (brokenRegex.test(content)) {
    content = content.replace(brokenRegex, (match, iconName, actionBlock) => {
      return 'icon={<' + iconName + ' color="primary" sx={{ fontSize: 40 }} />}\n        action={' + actionBlock + '}\n      />';
    });
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed syntax in ' + file);
  }
}
