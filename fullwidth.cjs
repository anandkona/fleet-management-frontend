const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match maxWidth: 1200, mx: 'auto' or similar inside the root Box
  const targetPattern = /maxWidth:\s*1200\s*,\s*mx:\s*'auto'/g;
  
  if (targetPattern.test(content)) {
    content = content.replace(targetPattern, "maxWidth: '100%'"); // replacing with 100% just in case there are other styles
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log('Updated width in ' + file);
  }
}
console.log('Total files updated: ' + updatedCount);
