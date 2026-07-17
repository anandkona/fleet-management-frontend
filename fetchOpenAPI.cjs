const https = require('https');
const fs = require('fs');

function fetchUrl(url, filename) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => { 
      fs.writeFileSync(filename, data); 
      console.log(`Saved ${url} to ${filename} (Size: ${data.length})`); 
    });
  }).on("error", (err) => { console.log(`Error on ${url}: ` + err.message); });
}

fetchUrl('https://backend-alpha-ten-24.vercel.app/api-json', 'api-json.json');
fetchUrl('https://backend-alpha-ten-24.vercel.app/docs-json', 'docs-json.json');
fetchUrl('https://backend-alpha-ten-24.vercel.app/docs/openapi.json', 'openapi.json');
