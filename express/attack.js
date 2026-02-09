import http from 'http';

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/buy-safe',
  method: 'POST'
};

console.log("🚀 Launching 200 concurrent requests...");

for (let i = 0; i < 200; i++) {
  const req = http.request(options, (res) => {
    console.log("sent the request")
    // We don't care about the response, we just want to hit the server
    res.on('data', () => {});
  });
  
  req.on('error', (e) => {
    // Ignore errors (some might fail if pool is full, that's fine)
  });
  
  req.end();
}