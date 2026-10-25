import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scrypt, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, extname, sep } from 'node:path';
import { emptyAccount, validData } from './validation.mjs';

const derive = promisify(scrypt);
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const SHORT_SESSION_MS = 8 * 60 * 60 * 1000;
const scryptOptions = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
const digest = (token) => createHash('sha256').update(token).digest('hex');
class ApiError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
const publicUser = (row) => ({ id: row.id, email: row.email, name: row.name });

export function createApp({
  databasePath,
  production = false,
  appOrigin,
  staticDirectory = resolve('dist'),
  resetDelivery = null,
}) {
  if (production && !appOrigin?.startsWith('https://'))
    throw new Error('Production requires APP_ORIGIN with HTTPS.');
  mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,salt TEXT NOT NULL,created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS user_data(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,data TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS auth_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS password_resets(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at INTEGER NOT NULL);`);
  const cookieName = production ? '__Host-365_session' : '365_session';
  const allowedOrigins = new Set(
    appOrigin
      ? [new URL(appOrigin).origin]
      : [
          'http://127.0.0.1:5173',
          'http://localhost:5173',
          'http://127.0.0.1:3001',
          'http://localhost:3001',
        ],
  );
  const cookie = (token, clear = false, remember = false) =>
    `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax${clear ? '; Max-Age=0' : remember ? `; Max-Age=${SESSION_MS / 1000}` : ''}${production ? '; Secure' : ''}`;
  const tokenFor = (req) => {
    const value = (req.headers.cookie ?? '')
      .split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? value : '';
  };
  function userFor(req) {
    const token = tokenFor(req);
    if (!token) return null;
    return (
      db
        .prepare(
          'SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token_hash=? AND expires_at>?',
        )
        .get(digest(token), Date.now()) ?? null
    );
  }
  function throttle(key) {
    const now = Date.now();
    db.prepare('DELETE FROM auth_limits WHERE expires_at<=?').run(now);
    const row = db.prepare('SELECT count FROM auth_limits WHERE key=?').get(key);
    if (row?.count >= 12) throw new ApiError(429, 'too_many_attempts');
    db.prepare(
      'INSERT INTO auth_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1',
    ).run(key, now + 15 * 60 * 1000);
  }
  function newSession(req, res, userId, remember = false) {
    const old = tokenFor(req);
    if (old) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(old));
    db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(
      digest(token),
      userId,
      Date.now() + (remember ? SESSION_MS : SHORT_SESSION_MS),
    );
    res.setHeader('Set-Cookie', cookie(token, false, remember));
  }
  function json(res, status, payload) {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(payload));
  }
  async function body(req) {
    if (!req.headers['content-type']?.startsWith('application/json'))
      throw new ApiError(415, 'json_required');
    let bytes = 0;
    const chunks = [];
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 2 * 1024 * 1024) throw new ApiError(413, 'payload_too_large');
      chunks.push(chunk);
    }
    try {
      const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
      return value;
    } catch {
      throw new ApiError(400, 'invalid_request');
    }
  }
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      if (path.startsWith('/api/')) {
        if (!['GET', 'HEAD'].includes(req.method)) {
          if (req.headers['x-365-request'] !== '1' || !allowedOrigins.has(req.headers.origin))
            throw new ApiError(403, 'invalid_origin');
        }
        if (path === '/api/auth/session' && req.method === 'GET') {
          const user = userFor(req);
          return json(res, 200, { user: user ? publicUser(user) : null });
        }
        if (path === '/api/auth/forgot-password' && req.method === 'POST') {
          const input = await body(req);
          const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
          throttle(`recovery-ip:${req.socket.remoteAddress}`);
          throttle(`recovery-email:${email.slice(0, 254)}`);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
            throw new ApiError(400, 'invalid_email');
          if (!resetDelivery) throw new ApiError(503, 'recovery_unavailable');
          const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
          if (user) {
            const token = randomBytes(32).toString('hex');
            const tokenHash = digest(token);
            db.prepare('DELETE FROM password_resets WHERE user_id=? OR expires_at<=?').run(
              user.id,
              Date.now(),
            );
            db.prepare('INSERT INTO password_resets VALUES(?,?,?)').run(
              tokenHash,
              user.id,
              Date.now() + 30 * 60 * 1000,
            );
            const origin = appOrigin ? new URL(appOrigin).origin : 'http://127.0.0.1:5173';
            try {
              await resetDelivery.send({
                to: email,
                url: `${origin}/#reset-password?token=${token}`,
              });
            } catch {
              db.prepare('DELETE FROM password_resets WHERE token_hash=?').run(tokenHash);
              throw new ApiError(503, 'recovery_unavailable');
            }
          }
          return json(res, 200, { ok: true, delivery: resetDelivery.mode });
        }
        if (path === '/api/auth/reset-password' && req.method === 'POST') {
          const input = await body(req);
          throttle(`reset-ip:${req.socket.remoteAddress}`);
          if (
            typeof input.token !== 'string' ||
            !/^[a-f0-9]{64}$/.test(input.token) ||
            typeof input.password !== 'string' ||
            input.password.length < 10 ||
            input.password.length > 128
          )
            throw new ApiError(400, 'invalid_reset');
          const tokenHash = digest(input.token);
          const reset = db
            .prepare('SELECT user_id FROM password_resets WHERE token_hash=? AND expires_at>?')
            .get(tokenHash, Date.now());
          if (!reset) throw new ApiError(400, 'invalid_reset');
          const salt = randomBytes(16).toString('hex');
          const hash = (await derive(input.password, salt, 64, scryptOptions)).toString('hex');
          db.exec('BEGIN IMMEDIATE');
          try {
            const used = db
              .prepare('DELETE FROM password_resets WHERE token_hash=? AND expires_at>?')
              .run(tokenHash, Date.now());
            if (!used.changes) throw new ApiError(400, 'invalid_reset');
            db.prepare('UPDATE users SET password_hash=?,salt=? WHERE id=?').run(
              hash,
              salt,
              reset.user_id,
            );
            db.prepare('DELETE FROM sessions WHERE user_id=?').run(reset.user_id);
            db.prepare('DELETE FROM password_resets WHERE user_id=?').run(reset.user_id);
            db.exec('COMMIT');
          } catch (error) {
            db.exec('ROLLBACK');
            throw error;
          }
          res.setHeader('Set-Cookie', cookie('', true));
          return json(res, 200, { ok: true });
        }
        if (
          (path === '/api/auth/register' || path === '/api/auth/login') &&
          req.method === 'POST'
        ) {
          const input = await body(req);
          const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
          const password = input.password;
          throttle(`ip:${req.socket.remoteAddress}`);
          throttle(`email:${email.slice(0, 254)}`);
          if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            email.length > 254 ||
            typeof password !== 'string' ||
            password.length > 128
          )
            throw new ApiError(400, 'invalid_credentials');
          if (path.endsWith('register')) {
            const name = typeof input.name === 'string' ? input.name.trim() : '';
            if (!name || name.length > 40 || password.length < 10)
              throw new ApiError(400, 'invalid_registration');
            if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
              throw new ApiError(409, 'email_exists');
            const salt = randomBytes(16).toString('hex');
            const hash = (await derive(password, salt, 64, scryptOptions)).toString('hex');
            const id = randomUUID();
            db.exec('BEGIN IMMEDIATE');
            try {
              db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(
                id,
                email,
                name,
                hash,
                salt,
                Date.now(),
              );
              db.prepare('INSERT INTO user_data(user_id,data) VALUES(?,?)').run(
                id,
                JSON.stringify(emptyAccount(name)),
              );
              db.exec('COMMIT');
            } catch (error) {
              db.exec('ROLLBACK');
              if (error.code?.startsWith('ERR_SQLITE')) throw new ApiError(409, 'email_exists');
              throw error;
            }
            newSession(req, res, id, input.remember === true);
            return json(res, 201, { user: { id, email, name } });
          }
          const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
          const hash = await derive(
            password,
            user?.salt ?? 'constant-missing-user-salt',
            64,
            scryptOptions,
          );
          if (!user || !timingSafeEqual(hash, Buffer.from(user.password_hash, 'hex')))
            throw new ApiError(401, 'invalid_credentials');
          newSession(req, res, user.id, input.remember === true);
          return json(res, 200, { user: publicUser(user) });
        }
        if (path === '/api/auth/logout' && req.method === 'POST') {
          const token = tokenFor(req);
          if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));
          res.setHeader('Set-Cookie', cookie('', true));
          return json(res, 200, { ok: true });
        }
        if (path === '/api/data' && ['GET', 'PUT'].includes(req.method)) {
          const user = userFor(req);
          if (!user) throw new ApiError(401, 'unauthorized');
          if (req.headers['x-account-id'] !== user.id) throw new ApiError(403, 'account_changed');
          if (req.method === 'GET') {
            const row = db
              .prepare('SELECT data,revision FROM user_data WHERE user_id=?')
              .get(user.id);
            return json(res, 200, { data: JSON.parse(row.data), revision: row.revision });
          }
          const input = await body(req);
          if (!validData(input.data) || !Number.isSafeInteger(input.revision) || input.revision < 0)
            throw new ApiError(400, 'invalid_data');
          const result = db
            .prepare(
              'UPDATE user_data SET data=?,revision=revision+1 WHERE user_id=? AND revision=?',
            )
            .run(JSON.stringify(input.data), user.id, input.revision);
          if (!result.changes) throw new ApiError(409, 'data_conflict');
          db.prepare('UPDATE users SET name=? WHERE id=?').run(input.data.name, user.id);
          return json(res, 200, { revision: input.revision + 1 });
        }
        throw new ApiError(404, 'not_found');
      }
      if (!['GET', 'HEAD'].includes(req.method)) throw new ApiError(405, 'method_not_allowed');
      const root = resolve(staticDirectory);
      const file =
        path === '/' ? resolve(root, 'index.html') : resolve(root, `.${decodeURIComponent(path)}`);
      if (!file.startsWith(root + sep)) throw new ApiError(404, 'not_found');
      let target = file;
      try {
        if (!statSync(target).isFile()) throw new Error();
      } catch {
        if (extname(path)) throw new ApiError(404, 'not_found');
        target = resolve(root, 'index.html');
      }
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.json': 'application/json',
      };
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      );
      res.writeHead(200, {
        'Content-Type': types[extname(target)] ?? 'application/octet-stream',
        'Cache-Control': extname(target) === '.html' ? 'no-cache' : 'public, max-age=3600',
      });
      res.end(req.method === 'HEAD' ? undefined : readFileSync(target));
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      if (!(error instanceof ApiError)) console.error('Request failed:', error.code ?? error.name);
      json(res, error instanceof ApiError ? error.status : 500, {
        error: error instanceof ApiError ? error.code : 'server_error',
      });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return {
    server,
    close: () =>
      new Promise((done, reject) =>
        server.close((error) => {
          db.close();
          error ? reject(error) : done();
        }),
      ),
  };
}
