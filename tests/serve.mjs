// Zero-dependency static server of the repo root for the e2e tests.
// Usage: node tests/serve.mjs [port]   (default 8795)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.argv[2] || process.env.PORT || 8795);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const send = (res, status, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
};

http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    return send(res, 400, 'bad request');
  }
  // The pages have no favicon: answer without a console error.
  if (pathname === '/favicon.ico') return send(res, 204, '');
  let file = path.join(root, pathname);
  if (file !== root.slice(0, -1) && !file.startsWith(root)) return send(res, 403, 'forbidden');
  // Same as the Worker's static assets: only what is deployed, never the repo internals.
  if (/^\/(\.|node_modules\/|tests\/|worker\/|migrations\/)/.test(pathname)) return send(res, 404, 'not found');
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = fs.readFileSync(file);
    send(res, 200, body, TYPES[path.extname(file)] || 'application/octet-stream');
  } catch {
    send(res, 404, 'not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
