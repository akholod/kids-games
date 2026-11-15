#!/usr/bin/env node
// List users, or deactivate / reactivate one (progress, coins and cards stay in the DB; the name stays taken).
// A deactivated user is hidden from the player list, cannot log in, and open sessions are ended.
// Usage: node scripts/user-status.mjs list [--local]
//        node scripts/user-status.mjs disable <name> [--local]
//        node scripts/user-status.mjs enable <name> [--local]
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const local = args.includes('--local');
const [cmd, rawName = ''] = args.filter((a) => !a.startsWith('--'));
const name = rawName.normalize('NFC').replace(/['’]/g, 'ʼ').replace(/\s+/g, ' ').trim(); // same as the server

const die = (m) => {
  console.error(m);
  process.exit(1);
};
const usage = 'Usage: node scripts/user-status.mjs list | disable <name> | enable <name> [--local]';
if (!['list', 'disable', 'enable'].includes(cmd)) die(usage);
if (cmd !== 'list' && !name) die(usage);

// KF_PERSIST_TO: optional local state dir (use the same --persist-to as `wrangler dev`).
const persist = local && process.env.KF_PERSIST_TO ? ['--persist-to', process.env.KF_PERSIST_TO] : [];
const d1 = (sql) => {
  const out = execFileSync(
    'wrangler',
    ['d1', 'execute', 'keeper-fun-games', local ? '--local' : '--remote', ...persist, '--json', '--command', sql],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  try {
    return JSON.parse(out);
  } catch {
    return die(`wrangler did not answer JSON:\n${out.slice(0, 500)}`);
  }
};
const q = (s) => `'${s.replace(/'/g, "''")}'`;

if (cmd === 'list') {
  const [{ results }] = d1('SELECT id, name, disabled FROM users ORDER BY name COLLATE NOCASE, id');
  for (const u of results) console.log(`${String(u.id).padStart(4)}  ${u.name}${u.disabled ? '  (disabled)' : ''}`);
  process.exit(0);
}

const off = cmd === 'disable' ? 1 : 0;
// Exact name first (as the server stores it), then a case-insensitive match if exactly one user has it.
const [{ results: found }] = d1(`SELECT id, name, disabled FROM users WHERE name = ${q(name)} COLLATE NOCASE`);
if (found.length !== 1) die(found.length ? `Several users match «${name}»: ${found.map((u) => u.name).join(', ')}` : `No user «${name}»`);
const [u] = found;
if (u.disabled === off) die(`«${u.name}» is already ${off ? 'disabled' : 'active'}`);
d1(
  off
    ? `UPDATE users SET disabled = 1 WHERE id = ${u.id}; DELETE FROM sessions WHERE user_id = ${u.id}`
    : `UPDATE users SET disabled = 0, failed = 0, locked_until = 0 WHERE id = ${u.id}`,
);
console.log(`«${u.name}» (id ${u.id}) is now ${off ? 'disabled' : 'active'}`);
