/**
 * F.R.I.D.A.Y. - Standalone Web Server
 * Zero external dependencies required. Works on any Linux/Windows VPS or local machine.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    // Remove query strings
    filePath = filePath.split('?')[0];

    const absolutePath = path.join(__dirname, filePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(absolutePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // If file not found, serve index.html (SPA fallback)
                fs.readFile(path.join(__dirname, 'index.html'), (fallbackErr, fallbackContent) => {
                    if (fallbackErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404: Fayl topilmadi');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(fallbackContent);
                    }
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end(`Server xatosi: ${err.code}`);
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(content);
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 FRIDAY AI SERVER ISHLAMOQDA!`);
    console.log(`📍 Manzil: http://localhost:${PORT}`);
    console.log(`🌐 Server tarmog'ida: http://${HOST}:${PORT}`);
    console.log(`====================================================`);
});
