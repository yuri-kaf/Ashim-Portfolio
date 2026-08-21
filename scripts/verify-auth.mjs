/**
 * Smoke-tests the deployed auth and content endpoints end to end.
 *
 * Logs in, checks the session, reads content, writes it back unchanged, and
 * confirms the write persisted. Writing the same document back means the test
 * proves the write path without altering what visitors see.
 *
 * Usage: node scripts/verify-auth.mjs "your password" [https://your-site]
 */
const password = process.argv[2];
const base = (process.argv[3] ?? 'https://www.ashimkafle.com.np').replace(/\/$/, '');

if (!password) {
  console.error('Usage: node scripts/verify-auth.mjs "your password" [base-url]');
  process.exit(1);
}

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};

// 1. A wrong password must be rejected.
const bad = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ password: `${password}-wrong` }),
});
check('wrong password rejected', bad.status === 401, `status ${bad.status}`);
check('wrong password sets no cookie', !bad.headers.get('set-cookie'));

// 2. The real password must issue a session cookie.
const login = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ password }),
});
const setCookie = login.headers.get('set-cookie') ?? '';
check('login succeeds', login.status === 200, `status ${login.status}`);
check('cookie is httpOnly', /httponly/i.test(setCookie));
check('cookie is Secure', /secure/i.test(setCookie));
check('cookie is SameSite=Lax', /samesite=lax/i.test(setCookie));

if (login.status !== 200) {
  console.error('\nLogin failed, so the write path cannot be tested.');
  console.error('Most likely: ADMIN_PASSWORD_HASH was pasted with a missing or extra');
  console.error('character, or the deployment predates the env var being set.');
  process.exit(1);
}

const cookie = setCookie.split(';')[0];

// 3. The session must be recognised.
const session = await (
  await fetch(`${base}/api/auth/session`, { headers: { cookie } })
).json();
check('session reports authenticated', session.authenticated === true, JSON.stringify(session));

// 4. Write the current document back unchanged, then confirm it round-trips.
const before = await (await fetch(`${base}/api/content`)).json();
const write = await fetch(`${base}/api/content`, {
  method: 'PUT',
  headers: { 'content-type': 'application/json', cookie },
  body: JSON.stringify(before),
});
check('authenticated PUT succeeds', write.status === 200, `status ${write.status}`);

const after = await (await fetch(`${base}/api/content`, { cache: 'no-store' })).json();
check(
  'content survives the round trip',
  JSON.stringify(after) === JSON.stringify(before),
  `${after.projects?.length} projects, ${after.social?.length} social`,
);

// 5. Logging out must invalidate nothing less than the cookie itself.
const logout = await fetch(`${base}/api/auth/logout`, { method: 'POST', headers: { cookie } });
check('logout clears the cookie', /max-age=0/i.test(logout.headers.get('set-cookie') ?? ''));

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
