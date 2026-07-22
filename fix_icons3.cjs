const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

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

let changedFiles = [];
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Fix Outlined / Icon suffixes being split by sx
  content = content.replace(/<([A-Za-z]+)\s*sx=\{\{\s*fontSize:\s*17\s*\}\}([A-Za-z]+)/g, '<$1$2 sx={{ fontSize: 17 }}');

  // 2. Fix duplicate sx/color/fontSize in the icon tags that got prepended with sx={{ fontSize: 17 }}
  content = content.replace(/(<[A-Za-z]+(?:Icon|Outlined)?\s*sx=\{\{\s*fontSize:\s*17\s*\}\})([^>]*>)/g, (match, part1, part2) => {
    let cleanPart2 = part2;
    while (cleanPart2.includes('sx=')) {
      cleanPart2 = removeProp(cleanPart2, 'sx');
    }
    while (cleanPart2.includes('color=')) {
      cleanPart2 = removeProp(cleanPart2, 'color');
    }
    while (cleanPart2.includes('fontSize=')) {
      cleanPart2 = removeProp(cleanPart2, 'fontSize');
    }
    return part1 + cleanPart2;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    changedFiles.push(file);
  }
});
console.log('Fixed syntax in files: ' + changedFiles.join(', '));
