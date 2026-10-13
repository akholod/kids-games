#!/usr/bin/env node
// Add (or with --update change the PIN of) a user.
// Usage: node scripts/add-user.mjs <name> <pin> [avatar] [--local] [--update]
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ITER = 100000;
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('--'));
const pos = args.filter((a) => !a.startsWith('--'));
const local = flags.includes('--local');
const update = flags.includes('--update');
const [name, pin, avatar = '⚽'] = pos;

const die = (m) => { console.error(m); process.exit(1); };
if (!name || !pin) die('Usage: node scripts/add-user.mjs <name> <pin> [avatar] [--local] [--update]');
if (!/^[\p{L} -]{1,30}$/u.test(name)) die('Name: letters, spaces, hyphen, up to 30 chars');
if (!/^\d{4}$/.test(pin)) die('PIN must be exactly 4 digits');
if (avatar.length > 16 || /['"\\;]/.test(avatar)) die('Bad avatar');

const salt = randomBytes(16);
const hash = pbkdf2Sync(pin, salt, ITER, 32, 'sha256');
const pinHash = `pbkdf2$${ITER}$${salt.toString('base64')}$${hash.toString('base64')}`;

const q = (s) => `'${s.replace(/'/g, "''")}'`;
const sql = update
  ? `UPDATE users SET pin_hash = ${q(pinHash)}, failed = 0, locked_until = 0 WHERE name = ${q(name)}`
  : `INSERT INTO users (name, avatar, pin_hash, created_at) VALUES (${q(name)}, ${q(avatar)}, ${q(pinHash)}, ${Date.now()})`;

// KF_PERSIST_TO: optional local state dir (use the same --persist-to as `wrangler dev`).
const persist = local && process.env.KF_PERSIST_TO ? ['--persist-to', process.env.KF_PERSIST_TO] : [];
execFileSync('wrangler', ['d1', 'execute', 'keeper-fun-games', local ? '--local' : '--remote', ...persist, '--command', sql], {
  stdio: 'inherit',
});
