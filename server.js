const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const PUBLIC_DIR = __dirname;

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg': case '.jpeg': return 'image/jpeg';
    case '.svg': return 'image/svg+xml';
    case '.ico': return 'image/x-icon';
    case '.mp3': return 'audio/mpeg';
    case '.wav': return 'audio/wav';
    case '.ogg': return 'audio/ogg';
    default: return 'application/octet-stream';
  }
}

const server = http.createServer((req, res) => {
  // Basic security: prevent path traversal and strip query string
  const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
  // Normalize and remove any leading slashes
  let safeSuffix = path.normalize(requestPath).replace(/^[/\\]+/, '');
  // Prevent path traversal: remove any '..' segments
  safeSuffix = safeSuffix.split(/[/\\]+/).filter(p => p !== '..').join(path.sep);
  let filePath = path.join(PUBLIC_DIR, safeSuffix || 'index.html');

  // If the request is a directory or root, serve index.html
  if (req.url === '/' || req.url.endsWith('/')) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      // fallback to index.html for single-page apps
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (err2, data) => {
        if (err2) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Server error');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
      });
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    fs.readFile(filePath, (err3, content) => {
      if (err3) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
        return;
      }
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
