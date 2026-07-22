const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let changedFiles = [];

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  const icons = ['Visibility', 'Edit', 'Delete', 'CheckCircle', 'VerifiedUser', 'Download', 'ThumbDown', 'Cancel', 'Receipt', 'Print'];

  const checkImport = (baseName) => {
    const allNames = [baseName, `${baseName}Icon`, `${baseName}Outline`, `${baseName}OutlineIcon`, `${baseName}Outlined`, `${baseName}OutlinedIcon`];
    for (const name of allNames) {
      const rx = new RegExp(`import\\s+([A-Za-z0-9_]+)\\s+from\\s+['"]@mui/icons-material/${name}['"]`);
      const match = content.match(rx);
      if (match) return match[1];
    }
    const allNamedImports = [...content.matchAll(/import\s+\{([^}]+)\}\s+from\s+['"]@mui\/icons-material['"]/g)];
    for (const match of allNamedImports) {
      const imports = match[1].split(',').map(s => s.trim());
      for (const imp of imports) {
        for (const name of allNames) {
          if (imp === name) return name;
          else if (imp.startsWith(`${name} as `)) return imp.split(' as ')[1].trim();
        }
      }
    }
    return null;
  };

  icons.forEach(iconName => {
    const importedName = checkImport(iconName);
    if (importedName && importedName !== iconName) {
      // Find tags that start with the base iconName followed immediately by a space (so <Visibility sx=... not <VisibilityIcon sx=...)
      // But they might also have 'Outlined' appended by fix_icons3.cjs, e.g. <EditOutlined sx=...
      // We can just replace `<${iconName} ` with `<${importedName} `
      const tagRegex = new RegExp(`<${iconName}\\s+sx=`, 'g');
      content = content.replace(tagRegex, `<${importedName} sx=`);
      
      const closeTagRegex = new RegExp(`</${iconName}>`, 'g');
      content = content.replace(closeTagRegex, `</${importedName}>`);
    }
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});

console.log('Fixed imports in: ' + changedFiles.join(', '));
