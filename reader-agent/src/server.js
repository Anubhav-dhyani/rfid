import http from 'node:http';
import { getNfcReaderState, startNfcReader, stopNfcReader } from '../../backend/src/services/nfcReaderService.js';

const port = Number(process.env.READER_AGENT_PORT || 3217);
const allowedOrigins = new Set([
  'https://verification.geu.ac.in',
  'http://localhost:5173',
  ...(process.env.READER_AGENT_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean)
]);

const server = http.createServer((req, res) => {
  const host = req.headers.host;
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
    res.writeHead(403).end();
    return;
  }

  const origin = req.headers.origin;
  if (origin && !allowedOrigins.has(origin)) {
    res.writeHead(403).end();
    return;
  }

  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  const url = new URL(req.url, `http://${host}`);
  if (req.method !== 'GET' || url.pathname !== '/status') {
    res.writeHead(404).end();
    return;
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(getNfcReaderState(url.searchParams.get('after'))));
});

// The reader belongs to this computer; the listener is never exposed to the LAN.
process.env.NFC_READER_ENABLED = 'true';
startNfcReader();
server.listen(port, '127.0.0.1', () => {
  console.log(`RFID reader agent listening on http://127.0.0.1:${port}`);
});

const shutdown = () => {
  stopNfcReader();
  server.close(() => process.exit(0));
};
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
