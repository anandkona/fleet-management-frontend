const fs = require('fs');
const https = require('https');
const FormData = require('form-data');

const form = new FormData();
form.append('vehicleId', 'cmrem6pm3000jl204a5ivpjyr');
form.append('amount', '123');
form.append('category', 'Toll');
form.append('notes', 'test upload');
form.append('receipt', Buffer.from('test receipt content'), {
  filename: 'receipt.txt',
  contentType: 'text/plain',
});

const options = {
  hostname: 'backend-alpha-ten-24.vercel.app',
  port: 443,
  path: '/api/v1/me/driver-expenses',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbXJpcm44N2swMDA1bDkwNDltNmZzbzF0IiwiZW1haWwiOiJzdXJlc2hAZ21haWwuY29tIiwicm9sZUtleSI6ImRyaXZlciIsImlhdCI6MTc4NDI4NzE0MiwiZXhwIjoxNzg0MzczNTQyfQ.MAeFFYBeYMMJjWyypAVET2rkQyWwaKMiUW7C_GCpT8k',
    ...form.getHeaders()
  }
};

const req = https.request(options, res => {
  let resData = '';
  res.on('data', chunk => resData += chunk);
  res.on('end', () => console.log('POST /me/driver-expenses', res.statusCode, resData));
});
form.pipe(req);
