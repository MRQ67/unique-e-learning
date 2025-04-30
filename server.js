// server.js
// Local HTTPS server for Next.js on LAN IP
const https = require('https');
const http = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const os = require('os');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

// Check for certificates
const certPath = path.join(__dirname, 'dev-cert.pem');
const keyPath = path.join(__dirname, 'dev-key.pem');
const hasCerts = fs.existsSync(keyPath) && fs.existsSync(certPath);

// HTTPS options
let httpsOptions = {};
if (hasCerts) {
  try {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    console.log('> SSL certificates loaded successfully');
  } catch (error) {
    console.error('> Error loading SSL certificates:', error.message);
    process.exit(1);
  }
}

// Determine LAN IP for access from other devices
const networkInterfaces = os.networkInterfaces();
let lanIp = 'localhost';
for (const iface in networkInterfaces) {
  for (const alias of networkInterfaces[iface] || []) {
    if (alias.family === 'IPv4' && !alias.internal) {
      lanIp = alias.address;
      break;
    }
  }
  if (lanIp !== 'localhost') break;
}

console.log('> Preparing Next.js app...');
app.prepare()
  .then(() => {
    console.log('> Next.js app prepared successfully');
    
    const handler = (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    };

    const PORT = 3000;
    const HOST = '0.0.0.0';
    
    if (hasCerts) {
      const server = https.createServer(httpsOptions, handler);
      
      server.listen(PORT, HOST, () => {
        console.log(`> HTTPS server running at https://${lanIp}:${PORT}`);
        console.log(`> You can also access it at https://localhost:${PORT}`);
        console.log('> Ready for connections!');
      });
      
      server.on('error', (err) => {
        console.error('> Server error:', err);
      });
    } else {
      console.warn('> WARNING: SSL certificates not found. Falling back to HTTP.');
      console.warn('> Webcam access may not work without HTTPS.');
      
      const server = http.createServer(handler);
      
      server.listen(PORT, HOST, () => {
        console.log(`> HTTP server running at http://${lanIp}:${PORT}`);
        console.log(`> You can also access it at http://localhost:${PORT}`);
        console.log('> Ready for connections!');
      });
      
      server.on('error', (err) => {
        console.error('> Server error:', err);
      });
    }
  })
  .catch((err) => {
    console.error('> Error preparing Next.js app:', err);
    process.exit(1);
  });
