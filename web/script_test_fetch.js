const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/orders?limit=1',
  method: 'GET',
};
// We need auth. Let's make an open admin user manually skipping auth or just check Prisma directly!
