const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');

const APP_ORIGIN = 'identifi://app';
const API_ORIGIN = 'https://verification.geu.ac.in';
const DIST_DIR = path.join(__dirname, '..', 'frontend', 'dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };

let authCookie = null;
let nfcService = null;
let readerError = null;
let mainWindow = null;

protocol.registerSchemesAsPrivileged([{ scheme: 'identifi', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

function isAppFrame(event) {
  return event.sender === mainWindow?.webContents && event.senderFrame?.url?.startsWith(`${APP_ORIGIN}/`);
}

async function serveApp(request) {
  const url = new URL(request.url);
  if (url.host !== 'app' || request.method !== 'GET') return new Response('Forbidden', { status: 403 });

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { return new Response('Bad path', { status: 400 }); }
  if (pathname.includes('\0') || pathname.includes('\\')) return new Response('Bad path', { status: 400 });

  const requested = path.resolve(DIST_DIR, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (requested !== DIST_DIR && !requested.startsWith(`${DIST_DIR}${path.sep}`)) return new Response('Forbidden', { status: 403 });

  let filePath = requested;
  let contents;
  try { contents = await fs.readFile(filePath); }
  catch {
    if (path.extname(pathname)) return new Response('Not found', { status: 404 });
    filePath = path.join(DIST_DIR, 'index.html');
    try { contents = await fs.readFile(filePath); }
    catch { return new Response('Desktop UI is not built. Run npm run build.', { status: 500 }); }
  }

  const contentType = MIME[path.extname(filePath)] || 'application/octet-stream';
  return new Response(contents, { headers: {
    'content-type': contentType,
    'content-security-policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'"
  } });
}

function makeBody(details) {
  if (details.form) {
    const form = new FormData();
    for (const entry of details.form) {
      if (entry.file) {
        if (entry.name !== 'file' || !/\.(xlsx|csv)$/i.test(entry.filename || '') || entry.bytes?.byteLength > 10 * 1024 * 1024) {
          throw new Error('Only XLSX and CSV files up to 10 MB are supported.');
        }
        form.append(entry.name, new Blob([entry.bytes], { type: entry.mime || 'application/octet-stream' }), entry.filename);
      } else {
        form.append(entry.name, String(entry.value ?? ''));
      }
    }
    return form;
  }
  return details.body || undefined;
}

async function proxyApi(event, details) {
  if (!isAppFrame(event)) throw new Error('Unauthorized desktop request.');
  if (!details || typeof details.path !== 'string' || !details.path.startsWith('/') || details.path.startsWith('//')) throw new Error('Invalid API path.');
  const method = details.method || 'GET';
  if (!['GET', 'POST', 'DELETE'].includes(method)) throw new Error('Unsupported API method.');

  const target = new URL(`/api${details.path}`, API_ORIGIN);
  if (target.origin !== API_ORIGIN || !target.pathname.startsWith('/api/')) throw new Error('Invalid API target.');
  const headers = {};
  if (details.contentType === 'application/json') headers['content-type'] = 'application/json';
  if (authCookie) headers.cookie = authCookie;

  let body;
  try { body = makeBody(details); }
  catch (error) { return { status: 400, body: { message: error.message } }; }

  try {
    const response = await fetch(target, { method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(30000) });
    const setCookie = response.headers.get('set-cookie');
    const sessionMatch = setCookie?.match(/(?:^|[,\s])admin_session=([^;]*)/);
    if (sessionMatch) authCookie = sessionMatch[1] ? `admin_session=${sessionMatch[1]}` : null;
    if (details.path === '/auth/logout' || response.status === 401) authCookie = null;
    const payload = await response.json().catch(() => ({}));
    return { status: response.status, body: payload };
  } catch (error) {
    return { status: 503, body: { message: `Cannot reach the central API: ${error.message}` } };
  }
}

async function startReader() {
  try {
    nfcService = await import('../backend/src/services/nfcReaderService.js');
    process.env.NFC_READER_ENABLED = 'true';
    nfcService.startNfcReader();
  } catch (error) {
    readerError = `Unable to start the ACR122U reader: ${error.message}`;
    console.error(readerError);
  }
}

app.whenReady().then(async () => {
  protocol.handle('identifi', serveApp);
  ipcMain.handle('desktop:request', proxyApi);
  ipcMain.handle('desktop:reader-status', (event, after) => {
    if (!isAppFrame(event)) throw new Error('Unauthorized desktop request.');
    return nfcService?.getNfcReaderState(after) || { enabled: true, connected: false, readerName: null, error: readerError || 'NFC reader is starting.', card: null };
  });
  await startReader();

  mainWindow = new BrowserWindow({
    width: 1360, height: 900, minWidth: 900, minHeight: 650,
    title: 'IdentiFi',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_ORIGIN}/`)) event.preventDefault();
  });
  mainWindow.loadURL(`${APP_ORIGIN}/`);
});

app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => nfcService?.stopNfcReader());
