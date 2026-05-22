import http from 'http';

http.get('http://localhost:3000/api/orders', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response /api/orders:', res.statusCode, data.slice(0, 500)));
}).on('error', err => console.error('Fetch error:', err.message));
