const https = require('https');

const options = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/dispatch/board', 
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJla2NxNG4wMDAydThxY21uODdod2ZxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVLZXkiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc4MzkyNjQwMiwiZXhwIjoxNzg0MDEyODAyfQ.T5-epZyPhcXSTjkogbpEKPW5DgxVoIqiMil3fJ_iN2E'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch(e) {
      console.log(data);
    }
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
