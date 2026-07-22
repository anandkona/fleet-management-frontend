const https = require('https');

const headers = {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJpcm44N2swMDA1bDkwNDltNmZzbzF0IiwiZW1haWwiOiJzdXJlc2hAZ21haWwuY29tIiwicm9sZUtleSI6ImRyaXZlciIsImlhdCI6MTc4NDI4NzE0MiwiZXhwIjoxNzg0MzczNTQyfQ.MAeFFYBeYMMJjWyypAVET2rkQyWwaKMiUW7C_GCpT8k'
};

function testEndpoint(path) {
  const options = {
    hostname: 'backend-alpha-ten-24.vercel.app',
    port: 443,
    path: path,
    method: 'GET',
    headers: headers
  };

  const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log(path, res.statusCode));
  });

  req.on('error', error => console.error(error));
  req.end();
}

testEndpoint('/api/v1/me/expense-categories');
testEndpoint('/api/v1/me/driver-expense-categories');
testEndpoint('/api/v1/me/categories');
