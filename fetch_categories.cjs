const https = require('https');

const options = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/finance/categories?limit=100',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJpcm44N2swMDA1bDkwNDltNmZzbzF0IiwiZW1haWwiOiJzdXJlc2hAZ21haWwuY29tIiwicm9sZUtleSI6ImRyaXZlciIsImlhdCI6MTc4NDI4NzE0MiwiZXhwIjoxNzg0MzczNTQyfQ.MAeFFYBeYMMJjWyypAVET2rkQyWwaKMiUW7C_GCpT8k'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});

req.on('error', error => console.error(error));
req.end();
