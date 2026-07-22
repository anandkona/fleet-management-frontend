const fs = require('fs');
const path = require('path');
const dir = 'd:/fleet-management1/src/fleet/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

let changed = [];
files.forEach(file => {
  let p = path.join(dir, file);
  let c = fs.readFileSync(p, 'utf8');
  let orig = c;
  
  // Fix 1: } sx={{ ... }} ); -> });
  // Example: images: t.images || []} sx={{ bgcolor: '#f59e0b15', color: '#f59e0b', '&:hover': { bgcolor: '#f59e0b30' } }} );
  c = c.replace(/\}\s*sx=\{\{[\s\S]*?\}\s*\}\}\s*\)\s*;/g, '});');
  
  // Fix 2: } sx={{ ... }} )} -> })}
  // Example: item: u} sx={{...}} )}
  c = c.replace(/\}\s*sx=\{\{[\s\S]*?\}\s*\}\}\s*\)\s*\}/g, '})}');
  
  // Fix 3: onClick={() => handleWorkflow(t.id, 'submit')} sx={{ ... }} >
  // Wait, if it's outside onClick, that's correct! But wait, is it outside?
  // Let's just fix the missing braces inside onClick.
  // Actually, wait! Did perfect_update.cjs miss adding sx= to the OUTSIDE because it skipped them?
  // YES! If it skipped them, they DON'T have sx= on the outside!
  // So we need to re-run perfect_update.cjs AFTER fixing them!
  
  if (c !== orig) {
    fs.writeFileSync(p, c);
    changed.push(file);
  }
});
console.log('Fixed untracked files syntax: ' + changed.join(', '));
