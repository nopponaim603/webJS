const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.webmanifest': 'application/manifest+json',
    '.wasm': 'application/wasm',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.ogg': 'audio/ogg',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// Create HTTP server
const server = http.createServer((req, res) => {
    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);

    // Get file path inside public/games/warfront directory
    const requestUrl = req.url.split('?')[0];
    let cleanUrl = requestUrl === '/' ? 'index.html' : requestUrl;
    if (cleanUrl.startsWith('/')) cleanUrl = cleanUrl.slice(1);

    let filePath = path.join(__dirname, 'public', 'games', 'warfront', cleanUrl);

    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve file (check src directory first, fallback to public)
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                const publicFilePath = path.join(__dirname, 'public', requestUrl === '/' ? 'games/warfront/index.html' : requestUrl);
                fs.readFile(publicFilePath, (errPublic, contentPublic) => {
                    if (errPublic) {
                        fs.readFile('./404.html', (err404, content404) => {
                            if (err404) {
                                res.writeHead(404, { 'Content-Type': 'text/html' });
                                res.end('<h1>404 - Page Not Found</h1>', 'utf-8');
                            } else {
                                res.writeHead(404, { 'Content-Type': 'text/html' });
                                res.end(content404, 'utf-8');
                            }
                        });
                    } else {
                        const headers = { 'Content-Type': contentType };
                        if (publicFilePath.endsWith('.unityweb')) {
                            headers['Content-Encoding'] = 'gzip';
                            if (publicFilePath.endsWith('.wasm.unityweb')) headers['Content-Type'] = 'application/wasm';
                            else if (publicFilePath.endsWith('.framework.js.unityweb')) headers['Content-Type'] = 'application/javascript';
                            else if (publicFilePath.endsWith('.data.unityweb')) headers['Content-Type'] = 'application/octet-stream';
                        }
                        res.writeHead(200, headers);
                        res.end(contentPublic);
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            // Success
            const headers = { 'Content-Type': contentType };
            if (filePath.endsWith('.unityweb')) {
                headers['Content-Encoding'] = 'gzip';
                if (filePath.endsWith('.wasm.unityweb')) headers['Content-Type'] = 'application/wasm';
                else if (filePath.endsWith('.framework.js.unityweb')) headers['Content-Type'] = 'application/javascript';
                else if (filePath.endsWith('.data.unityweb')) headers['Content-Type'] = 'application/octet-stream';
            }
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

// Start server
server.listen(PORT, HOST, () => {
    console.log('='.repeat(50));
    console.log('🎮 Game Portfolio Server Started!');
    console.log('='.repeat(50));
    console.log(`📡 Server running at: http://${HOST}:${PORT}/`);
    console.log(`🌐 Local:            http://localhost:${PORT}/`);
    console.log(`🖥️  Network:          http://${getLocalIP()}:${PORT}/`);
    console.log('='.repeat(50));
    console.log('Press Ctrl+C to stop the server');
    console.log('='.repeat(50));
});

// Get local IP address
function getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal addresses
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Error: Port ${PORT} is already in use.`);
        console.log(`💡 Try using a different port: PORT=3001 node server.js`);
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
