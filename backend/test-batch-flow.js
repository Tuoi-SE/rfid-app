/**
 * Test Script: Batch Scan Flow
 *
 * Flow: Admin quét 1000 thẻ RFID và gán sản phẩm
 *
 * Usage: node test-batch-flow.js
 */

const http = require('http');
const { io } = require('socket.io-client');

// Config
const API_URL = 'http://localhost:3000';
const WS_URL = 'http://localhost:3000';

// Test data - generate 1000 unique EPCs
function generateEPCs(count) {
  const epcs = [];
  for (let i = 0; i < count; i++) {
    const epc = `TEST${String(i).padStart(10, '0')}`;
    epcs.push(epc);
  }
  return epcs;
}

// Step 1: Login as admin
async function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.data?.access_token) {
            resolve(result.data.access_token);
          } else {
            reject(new Error('No access token in response: ' + body));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Step 2: Create a test product if not exists
async function createProduct(token) {
  return new Promise((resolve, reject) => {
    const productData = JSON.stringify({
      name: 'Test Product Batch',
      sku: 'TPB-' + Date.now(),
      categoryId: null,
      description: 'Test product for batch flow'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': productData.length,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('Product created:', result.data?.id || result.message);
          resolve(result.data?.id);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(productData);
    req.end();
  });
}

// Step 3: Connect to WebSocket and send batch scan
async function batchScan(token, epcs) {
  return new Promise((resolve, reject) => {
    const socket = io(WS_URL, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');

      // Send batch scan
      socket.emit('batchScan', epcs, (response) => {
        console.log('Batch scan response:', JSON.stringify(response));
        socket.disconnect();
        resolve(response);
      });
    });

    socket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message);
      reject(err);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout waiting for batch scan'));
    }, 30000);
  });
}

// Step 4: Get tags and find the test ones
async function getTags(token, searchPrefix) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/tags?epc=${searchPrefix}&limit=100`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Step 5: Assign product to tags
async function assignProduct(token, tagIds, productId) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      tagIds,
      productId
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/tags/assign',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('Assign response:', JSON.stringify(result));
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main test
async function runTest() {
  console.log('=== TEST: Batch Scan Flow ===\n');

  try {
    // Step 1: Login
    console.log('Step 1: Login as admin...');
    const token = await login();
    console.log('Login OK\n');

    // Step 2: Create test product
    console.log('Step 2: Create test product...');
    const productId = await createProduct(token);
    if (!productId) {
      console.log('Warning: Could not create product, will use existing one');
    }
    console.log('');

    // Step 3: Generate 1000 EPCs
    console.log('Step 3: Generate 1000 test EPCs...');
    const epcs = generateEPCs(1000);
    console.log(`Generated ${epcs.length} EPCs (${epcs[0]} to ${epcs[999]})\n`);

    // Step 4: Batch scan
    console.log('Step 4: Send batch scan via WebSocket...');
    const scanResult = await batchScan(token, epcs);
    console.log('Batch scan result:', JSON.stringify(scanResult, null, 2));
    console.log('');

    // Step 5: Get tags back
    console.log('Step 5: Query tags to verify...');
    const tagsResult = await getTags(token, 'TEST');
    console.log(`Found ${tagsResult.data?.length || 0} test tags`);
    console.log('');

    // Step 6: Assign product to first 10 tags
    if (tagsResult.data?.length > 0 && productId) {
      console.log('Step 6: Assign product to first 10 tags...');
      const tagIds = tagsResult.data.slice(0, 10).map(t => t.id);
      const assignResult = await assignProduct(token, tagIds, productId);
      console.log('Assign result:', JSON.stringify(assignResult, null, 2));
    }

    console.log('\n=== TEST COMPLETE ===');
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

runTest();
