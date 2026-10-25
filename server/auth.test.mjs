import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, basename } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from './app.mjs';
let folder, app, base;
const password = 'Test-passphrase-2026';
async function start(options = {}) {
  app = createApp({ databasePath: join(folder, 'accounts.sqlite'), ...options });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${app.server.address().port}`;
}
beforeEach(async () => {
  folder = mkdtempSync(join(tmpdir(), '365-auth-test-'));
  await start();
});
afterEach(async () => {
  await app.close();
  if (dirname(folder) !== resolve(tmpdir()) || !basename(folder).startsWith('365-auth-test-'))
    throw new Error('Unexpected test directory');
  rmSync(folder, { recursive: true, force: true });
});
async function request(
  path,
  { method = 'GET', body, cookie, accountId, origin = 'http://127.0.0.1:5173', csrf = true } = {},
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(accountId ? { 'X-Account-ID': accountId } : {}),
      ...(method !== 'GET' ? { Origin: origin, ...(csrf ? { 'X-365-Request': '1' } : {}) } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {
    status: response.status,
    body: await response.json(),
    cookie: response.headers.get('set-cookie'),
  };
}
async function register(email = 'one@example.test') {
  const result = await request('/api/auth/register', {
    method: 'POST',
    body: { name: 'Test user', email, password },
  });
  assert.equal(result.status, 201);
  return { user: result.body.user, cookie: result.cookie.split(';')[0], header: result.cookie };
}

test('remember me controls persistent cookies', async () => {
  const auth = await register();
  assert.doesNotMatch(auth.header, /Max-Age/);
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: auth.user.email, password, remember: true },
  });
  assert.match(login.cookie, /Max-Age=604800/);
});

test('password recovery is private, single-use and revokes existing sessions', async () => {
  await app.close();
  const messages = [];
  await start({
    resetDelivery: { mode: 'local', send: async (message) => messages.push(message) },
  });
  const auth = await register();
  const forgot = (email) =>
    request('/api/auth/forgot-password', { method: 'POST', body: { email } });
  const known = await forgot(auth.user.email);
  const unknown = await forgot('missing@example.test');
  assert.deepEqual(known.body, unknown.body);
  assert.equal(messages.length, 1);
  assert.deepEqual(known.body, { ok: true, delivery: 'local' });
  const token = new URLSearchParams(new URL(messages[0].url).hash.split('?')[1]).get('token');
  const nextPassword = 'Changed-passphrase-2026';
  const reset = () =>
    request('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: nextPassword },
    });
  assert.equal((await reset()).status, 200);
  assert.equal((await reset()).status, 400);
  assert.equal((await request('/api/auth/session', { cookie: auth.cookie })).body.user, null);
  assert.equal(
    (
      await request('/api/auth/login', {
        method: 'POST',
        body: { email: auth.user.email, password },
      })
    ).status,
    401,
  );
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: auth.user.email, password: nextPassword },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.id, auth.user.id);
  await forgot(auth.user.email);
  const expired = new URLSearchParams(new URL(messages[1].url).hash.split('?')[1]).get('token');
  const db = new DatabaseSync(join(folder, 'accounts.sqlite'));
  db.prepare('UPDATE password_resets SET expires_at=0').run();
  db.close();
  assert.equal(
    (
      await request('/api/auth/reset-password', {
        method: 'POST',
        body: { token: expired, password: nextPassword },
      })
    ).status,
    400,
  );
});
test('registration creates a real empty account and stores only a salted password hash', async () => {
  const auth = await register();
  assert.match(auth.header, /HttpOnly/);
  assert.match(auth.header, /SameSite=Lax/);
  assert.doesNotMatch(auth.header, /Test-passphrase/);
  const result = await request('/api/data', { cookie: auth.cookie, accountId: auth.user.id });
  assert.equal(result.status, 200);
  for (const key of ['tasks', 'habits', 'goals', 'events', 'health', 'transactions', 'notes'])
    assert.deepEqual(result.body.data[key], []);
  assert.equal(result.body.data.name, 'Test user');
  const db = new DatabaseSync(join(folder, 'accounts.sqlite'));
  const row = db.prepare('SELECT password_hash,salt FROM users').get();
  assert.notEqual(row.password_hash, password);
  assert.equal(row.salt.length, 32);
  assert.equal(row.password_hash.length, 128);
  db.close();
});
test('login checks passwords and logout revokes the server session', async () => {
  const auth = await register();
  const wrong = await request('/api/auth/login', {
    method: 'POST',
    body: { email: auth.user.email, password: 'incorrect-password' },
  });
  assert.equal(wrong.status, 401);
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: auth.user.email, password },
  });
  assert.equal(login.status, 200);
  const cookie = login.cookie.split(';')[0];
  assert.equal((await request('/api/auth/session', { cookie })).body.user.id, auth.user.id);
  assert.equal(
    (await request('/api/auth/logout', { method: 'POST', body: {}, cookie })).status,
    200,
  );
  assert.equal((await request('/api/auth/session', { cookie })).body.user, null);
  assert.equal((await request('/api/data', { cookie, accountId: auth.user.id })).status, 401);
});
test('accounts cannot read or write each other records, including stale requests after switching accounts', async () => {
  const first = await register();
  const second = await register('two@example.test');
  const firstData = await request('/api/data', { cookie: first.cookie, accountId: first.user.id });
  firstData.body.data.notes.push({
    id: 'private',
    title: 'Only mine',
    content: 'private text',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
  });
  assert.equal(
    (
      await request('/api/data', {
        method: 'PUT',
        cookie: first.cookie,
        accountId: first.user.id,
        body: firstData.body,
      })
    ).status,
    200,
  );
  const own = await request(`/api/data?userId=${first.user.id}`, {
    cookie: second.cookie,
    accountId: second.user.id,
  });
  assert.deepEqual(own.body.data.notes, []);
  assert.equal(
    (await request('/api/data', { cookie: second.cookie, accountId: first.user.id })).status,
    403,
  );
  assert.equal(
    (
      await request('/api/data', {
        method: 'PUT',
        cookie: second.cookie,
        accountId: first.user.id,
        body: firstData.body,
      })
    ).status,
    403,
  );
});
test('rejects cross-origin requests and missing CSRF request headers', async () => {
  const body = { name: 'Test', email: 'one@example.test', password };
  assert.equal(
    (await request('/api/auth/register', { method: 'POST', body, origin: 'https://evil.example' }))
      .status,
    403,
  );
  assert.equal(
    (await request('/api/auth/register', { method: 'POST', body, csrf: false })).status,
    403,
  );
  assert.equal((await request('/api/data')).status, 401);
});
test('validation and optimistic revisions prevent invalid or stale overwrites', async () => {
  const auth = await register();
  const saved = await request('/api/data', { cookie: auth.cookie, accountId: auth.user.id });
  const options = { method: 'PUT', cookie: auth.cookie, accountId: auth.user.id };
  assert.equal(
    (
      await request('/api/data', {
        ...options,
        body: { ...saved.body, data: { ...saved.body.data, tasks: [{ id: 'bad' }] } },
      })
    ).status,
    400,
  );
  assert.equal((await request('/api/data', { ...options, body: saved.body })).status, 200);
  assert.equal((await request('/api/data', { ...options, body: saved.body })).status, 409);
});
test('accounts, sessions and data survive a server restart', async () => {
  const auth = await register();
  const saved = await request('/api/data', { cookie: auth.cookie, accountId: auth.user.id });
  saved.body.data.notes.push({
    id: 'saved',
    title: 'Saved for later',
    content: 'Retained',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
  });
  await request('/api/data', {
    method: 'PUT',
    cookie: auth.cookie,
    accountId: auth.user.id,
    body: saved.body,
  });
  await app.close();
  await start();
  const restored = await request('/api/data', { cookie: auth.cookie, accountId: auth.user.id });
  assert.equal(restored.body.data.notes[0].content, 'Retained');
  assert.equal(
    (await request('/api/auth/session', { cookie: auth.cookie })).body.user.id,
    auth.user.id,
  );
});
test('duplicate registration and weak passwords do not create extra accounts', async () => {
  await register();
  assert.equal(
    (
      await request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Test', email: 'one@example.test', password },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Test', email: 'weak@example.test', password: 'short' },
      })
    ).status,
    400,
  );
});
test('repeated authentication attempts are rate limited', async () => {
  for (let i = 0; i < 12; i++)
    await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'missing@example.test', password: 'wrong' },
    });
  assert.equal(
    (
      await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'missing@example.test', password: 'wrong' },
      })
    ).status,
    429,
  );
});
