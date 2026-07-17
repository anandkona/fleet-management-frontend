const fs = require('fs');
const glob = require('fs').readdirSync('d:/fleet-management1/src/fleet/pages');
let count1 = 0, count2 = 0, count3 = 0, count4 = 0;
glob.forEach(f => {
  if (f.endsWith('.jsx')) {
    const text = fs.readFileSync('d:/fleet-management1/src/fleet/pages/' + f, 'utf8');
    count1 += (text.match(/,1/g) || []).length;
    count2 += (text.match(/\?"/g) || []).length;
    count3 += (text.match(/â‚¹/g) || []).length;
    count4 += (text.match(/â€”/g) || []).length;
    count1 += (text.match(/,1/g) || []).length; // backup
  }
});
console.log('Q,1:', count1);
console.log('Q?":', count2);
console.log('â‚¹:', count3);
console.log('â€”:', count4);
