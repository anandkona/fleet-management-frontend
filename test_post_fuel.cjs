const https = require('https');

const data = JSON.stringify({});

const options = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/me/driver-fuel',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJpcm44N2swMDA1bDkwNDltNmZzbzF0IiwiZW1haWwiOiJzdXJlc2hAZ21haWwuY29tIiwicm9sZUtleSI6ImRyaXZlciIsImlhdCI6MTc4NDI4NzE0MiwiZXhwIjoxNzg0MzczNTQyfQ.MAeFFYBeYMMJjWyypAVET2rkQyWwaKMiUW7C_GCpT8k',
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => console.log('POST /me/driver-fuel', res.statusCode, resData));
});
req.write(data);
req.end();
