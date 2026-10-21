import { test, expect, open, expectNoCyrillic } from './helpers.mjs';

// Everything runs in ?parent mode: KF.auth is a per-tab sandbox (demo player, PIN 1234, no network).
const user = (page) => page.evaluate(() => KF.auth.user);
const digits = async (tap, keypad, pin) => {
  for (const d of pin) await tap(keypad.getByRole('button', { name: d, exact: true }));
};

// Catalog: log in as the sandbox demo player with the catalog's PIN pad.
const login = async (page, tap, pin = '1234', lang) => {
  await open(page, '/', { lang });
  await tap(page.locator('#who-btn'));
  await expect(page.locator('#step-pick')).toBeVisible();
  await tap(page.locator('#players .player:not(.player-add)').first());
  for (const d of pin) await tap(page.locator(`#keypad [data-digit="${d}"]`));
  await expect(page.locator('#login-dialog')).toBeHidden();
  await expect.poll(() => user(page)).not.toBeNull();
};

test('profile: log in from the catalog, the header shows the shirt, the menu leads to the profile', async ({ page, tap }) => {
  await login(page, tap);
  await expect(page.locator('#login-dialog')).toBeHidden();
  expect(await user(page)).toMatchObject({ name: 'Тестовий гравець', avatar: 'k:stripes:blue:yellow:1' });
  await expect(page.locator('#who-btn svg')).toBeVisible();
  await tap(page.locator('#who-btn'));
  await tap(page.locator('.who-profile'));
  await expect(page).toHaveURL(/\/profile\/$/);
  await expect(page.locator('#pc-name')).toHaveText(/Тестовий гравець/i);
  await expect(page.locator('#pc-kit svg')).toBeVisible();
  await expect(page.locator('#pf-guest')).toBeHidden();
});

test('profile: design a shirt (pattern, colours, number, picture) and save it', async ({ page, tap }) => {
  await login(page, tap);
  await page.goto('/profile/');
  await expect(page.locator('#kit-save')).toBeHidden(); // nothing changed yet
  await tap(page.locator('#kit-basic [data-pattern="halves"]'));
  await tap(page.locator('#kit-c1 [data-color="red"]'));
  await tap(page.locator('#kit-c2 [data-color="white"]'));
  await tap(page.locator('#mark-kind [data-kind="number"]'));
  await tap(page.locator('#num-plus'));
  await tap(page.locator('#kit-save'));
  await expect.poll(async () => (await user(page)).avatar).toBe('k:halves:red:white:2');
  // a picture instead of the number
  await tap(page.locator('#mark-kind [data-kind="picture"]'));
  await tap(page.locator('#kit-marks button', { hasText: '🦁' }));
  await tap(page.locator('#kit-save'));
  await expect.poll(async () => (await user(page)).avatar).toBe('k:halves:red:white:🦁');
  // kept after a reload (same tab) and shown in the catalog header
  await page.reload();
  await expect(page.locator('#kit-basic [data-pattern="halves"]')).toHaveAttribute('aria-checked', 'true');
});

test('profile: special shirts are locked until their achievement', async ({ page, tap }) => {
  await login(page, tap);
  await page.goto('/profile/');
  const fire = page.locator('#kit-specials [data-pattern="fire"]');
  await expect(fire).toHaveAttribute('aria-disabled', 'true');
  await fire.dispatchEvent('click'); // a locked shirt only explains how to open it
  await expect(page.locator('#kit-lock')).toContainText(/Нестримний|серія|поспіль/i);
  await expect(page.locator('#kit-save')).toBeHidden();
  // the achievement opens it
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) KF.answer('dictado', true); // 5 right in a row → «streak-5»
  });
  expect(await page.evaluate(() => !!KF.get().achievements['streak-5'])).toBe(true);
  await page.reload();
  await tap(page.locator('#kit-specials [data-pattern="fire"]'));
  await tap(page.locator('#kit-save'));
  await expect.poll(async () => (await user(page)).avatar).toMatch(/^k:fire:/);
});

test('profile: rename needs the right PIN; a wrong one counts down', async ({ page, tap }) => {
  await login(page, tap);
  await page.goto('/profile/');
  await tap(page.locator('#tab-name'));
  await page.locator('#name-new').fill('Олег');
  const wrong = async () => {
    await digits(tap, page.locator('#name-keypad'), '9999');
    await tap(page.locator('#name-save'));
  };
  await wrong();
  await expect(page.locator('#name-msg')).toContainText(/PIN/);
  for (let i = 0; i < 4; i++) await tap(page.locator('#name-keypad .key-erase'));
  await wrong();
  await expect(page.locator('#name-msg')).toContainText('3'); // attempts left (shown from 3 down)
  expect((await user(page)).name).toBe('Тестовий гравець');
  for (let i = 0; i < 4; i++) await tap(page.locator('#name-keypad .key-erase'));
  await digits(tap, page.locator('#name-keypad'), '1234');
  await tap(page.locator('#name-save'));
  await expect.poll(async () => (await user(page)).name).toBe('Олег');
  await expect(page.locator('#pc-name')).toHaveText(/Олег/i);
});

test('profile: change the PIN, then log in with the new one', async ({ page, tap }) => {
  await login(page, tap);
  await page.goto('/profile/');
  await tap(page.locator('#tab-pin'));
  const pad = page.locator('#pin-keypad');
  await digits(tap, pad, '1234' + '5678' + '5679');
  await tap(page.locator('#pin-save'));
  await expect(page.locator('#pin-msg')).not.toBeEmpty(); // the repeat doesn't match: both new boxes are cleared
  await digits(tap, pad, '56785678');
  await tap(page.locator('#pin-save'));
  await expect(page.locator('#pin-msg')).toContainText(/PIN/);
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem('kf-test-auth')).users[0].pin)).toBe('5678');
  // log out and back in with the new PIN
  await page.goto('/');
  expect(await page.evaluate(() => KF.auth.logout().then((r) => r.ok))).toBe(true);
  expect(await page.evaluate(() => KF.auth.login(KF.auth.user?.id ?? 1, '1234').then((r) => r.error))).toBe('bad_pin');
  const id = await page.evaluate(() => KF.auth.users().then((r) => r.users[0].id));
  expect(await page.evaluate((i) => KF.auth.login(i, '5678').then((r) => r.ok), id)).toBe(true);
});

test('profile: a new player picks a shirt colour and a picture in the catalog', async ({ page, tap }) => {
  await open(page, '/');
  await tap(page.locator('#who-btn'));
  await tap(page.locator('#add-player'));
  await page.locator('#new-name').fill('Марко');
  await tap(page.locator('#new-colors [data-color="green"]'));
  await tap(page.locator('#new-avatars button', { hasText: '🦊' }));
  await tap(page.locator('#new-next'));
  for (const d of '2468') await tap(page.locator(`#keypad [data-digit="${d}"]`));
  await expect(page.locator('#pin-title')).toHaveText(/Повтори/);
  for (const d of '2468') await tap(page.locator(`#keypad [data-digit="${d}"]`));
  await expect(page.locator('#login-dialog')).toBeHidden();
  expect(await user(page)).toMatchObject({ name: 'Марко', avatar: 'k:plain:green:green:🦊' });
});

test('profile: a guest sees the card and a button that opens the login', async ({ page, tap }) => {
  await open(page, '/profile/');
  await expect(page.locator('#pf-guest')).toBeVisible();
  await expect(page.locator('#player-card')).toBeVisible();
  await tap(page.locator('#pf-login'));
  await expect(page.locator('#step-pick')).toBeVisible();
});

test('profile: Spanish site — no Cyrillic, logged in and as a guest', async ({ page, tap }) => {
  await open(page, '/profile/', { lang: 'es' });
  await expectNoCyrillic(page, 'guest profile');
  await login(page, tap, '1234', 'es');
  expect((await user(page)).name).toBe('Jugador de prueba');
  await page.goto('/profile/');
  await expectNoCyrillic(page, 'shirt editor');
  for (const tab of ['#tab-name', '#tab-pin']) {
    await tap(page.locator(tab));
    await expectNoCyrillic(page, tab);
  }
});

test('profile: the parent switch opens every special shirt for testing (test mode only)', async ({ page, tap }) => {
  await login(page, tap);
  await page.goto('/profile/');
  const sw = page.locator('#pf-unlock-all');
  await expect(sw).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#kit-specials .is-locked')).toHaveCount(10);
  await tap(sw);
  await expect(page.locator('#kit-specials .is-locked')).toHaveCount(0);
  await tap(page.locator('#kit-specials [data-pattern="galaxy"]'));
  await tap(page.locator('#kit-save'));
  await expect.poll(async () => (await user(page)).avatar).toMatch(/^k:galaxy:/);
  await tap(sw);
  await expect(page.locator('#kit-specials .is-locked')).toHaveCount(10);
  // the login dialog tells the parent the demo PIN
  await page.goto('/');
  expect(await page.evaluate(() => KF.auth.logout().then((r) => r.ok))).toBe(true);
  await tap(page.locator('#who-btn'));
  await expect(page.locator('#pick-test-hint')).toContainText('1234');
});
