import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

process.env.ADMIN_LOGIN_ID = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password';
process.env.JWT_SECRET = 'test-secret-with-more-than-thirty-two-characters';

async function withServer(run) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

test('protected endpoints reject anonymous requests', () => withServer(async (url) => {
  const response = await fetch(`${url}/auth/me`);
  assert.equal(response.status, 401);
}));

test('admin can login and use the HTTP-only session', () => withServer(async (url) => {
  const login = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'test-admin', password: 'test-password' })
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie');
  assert.match(cookie, /admin_session=/);
  assert.match(cookie, /HttpOnly/);

  const me = await fetch(`${url}/auth/me`, { headers: { Cookie: cookie.split(';')[0] } });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { admin: { loginId: 'test-admin', role: 'admin' } });
}));

test('invalid admin credentials are rejected', () => withServer(async (url) => {
  const response = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: 'test-admin', password: 'wrong' })
  });
  assert.equal(response.status, 401);
}));
