const https = require('https');

const options = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/auth/me', // let's see if user info has menus, or if there's a menu endpoint
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJla2NxNG4wMDAydThxY21uODdod2ZxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVLZXkiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc4MzkyNjQwMiwiZXhwIjoxNzg0MDEyODAyfQ.T5-epZyPhcXSTjkogbpEKPW5DgxVoIqiMil3fJ_iN2E'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Status:", res.statusCode);
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

const options2 = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/menu', 
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJla2NxNG4wMDAydThxY21uODdod2ZxIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGVLZXkiOiJzdXBlcl9hZG1pbiIsImlhdCI6MTc4MzkyNjQwMiwiZXhwIjoxNzg0MDEyODAyfQ.T5-epZyPhcXSTjkogbpEKPW5DgxVoIqiMil3fJ_iN2E'
  }
};
const req2 = https.request(options2, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log("Menu Status:", res.statusCode);
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch(e) {
      console.log(data);
    }
  });
});
req2.end();
