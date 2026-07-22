const https = require('https');

const options = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/me/driver-expenses',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJpcm44N2swMDA1bDkwNDltNmZzbzF0IiwiZW1haWwiOiJzdXJlc2hAZ21haWwuY29tIiwicm9sZUtleSI6ImRyaXZlciIsImlhdCI6MTc4NDI4NzE0MiwiZXhwIjoxNzg0MzczNTQyfQ.MAeFFYBeYMMJjWyypAVET2rkQyWwaKMiUW7C_GCpT8k'
  }
};

const req = https.request(options, res => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => console.log('GET /me/driver-expenses', res.statusCode, resData));
});
req.end();
