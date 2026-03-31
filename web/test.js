const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/orders?limit=1',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(data));
});
req.end();
