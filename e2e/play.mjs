// Test end-to-end: memainkan permainan lewat UI di browser sungguhan.
// Jalankan: npm run build && npm run preview (port 4173), lalu: npm run e2e
// Butuh Playwright (npm i -D playwright && npx playwright install chromium).

import { createRequire } from 'node:module';

// createRequire supaya Playwright bisa dari node_modules proyek maupun instalasi global (NODE_PATH).
const { chromium } = createRequire(import.meta.url)('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const SHOTS = process.env.SHOTS_DIR;
const log = (...a) => console.log('[e2e]', ...a);

async function visible(locator) {
  return (await locator.count()) > 0 && (await locator.first().isVisible());
}

/** Satu langkah "pemain manusia": klik tombol yang relevan di layar. */
async function step(page) {
  const dialog = page.getByRole('dialog');
  if (await visible(dialog)) {
    const title = (await dialog.locator('h2').first().textContent()) ?? '';
    if (title.includes('Permainan Selesai')) return 'over';
    if (title.includes('Lelang')) {
      await dialog.getByRole('button', { name: 'Mundur dari lelang' }).click();
      return 'auction';
    }
    if (title.includes('kurang uang')) {
      for (const name of [/^Bayar/, /otomatis/, /bangkrut/]) {
        const b = dialog.getByRole('button', { name });
        if ((await visible(b)) && (await b.first().isEnabled())) {
          await b.first().click();
          return 'debt';
        }
      }
    }
    if (title.includes('Masukkan angka')) {
      const faces = dialog.locator('.dice-picker-row');
      const n = await faces.count();
      for (let k = 0; k < n; k++) await faces.nth(k).getByRole('button').nth(Math.floor(Math.random() * 6)).click();
      await dialog.getByRole('button', { name: /Jalan|OK/ }).click();
      return 'dice';
    }
    // Kartu, beli, pajak, pungli, dll: pilih tombol utama yang aktif, jika tidak ada pilih tombol aktif pertama.
    const primary = dialog.locator('.prompt-actions .btn-primary:enabled');
    if (await visible(primary)) {
      await primary.first().click();
      return 'prompt';
    }
    const any = dialog.locator('.prompt-actions .btn:enabled');
    if (await visible(any)) {
      await any.first().click();
      return 'prompt';
    }
    // Dialog sedang berganti isi; coba lagi di langkah berikutnya (macet sungguhan tertangkap oleh batas tunggu).
    return 'wait';
  }
  for (const name of [/Lempar Dadu|Masukkan Dadu/, /Lempar, cari dobel/, /Selesai Giliran/]) {
    const b = page.getByRole('button', { name });
    if ((await visible(b)) && (await b.first().isEnabled())) {
      await b.first().click();
      return 'turn';
    }
  }
  return 'wait';
}

async function playUntilOver(page, maxSteps) {
  let waits = 0;
  for (let i = 0; i < maxSteps; i++) {
    const r = await step(page);
    if (r === 'over') return i;
    if (r === 'wait') {
      if (++waits > 200) throw new Error('UI macet: tidak ada aksi yang bisa dilakukan');
      await page.waitForTimeout(150);
    } else waits = 0;
    await page.waitForTimeout(60);
  }
  throw new Error(`Permainan belum selesai setelah ${maxSteps} langkah`);
}

async function newGame(page, { mode, dice, rounds, view = '3d' }) {
  await page.goto(BASE);
  await page.evaluate((v) => {
    localStorage.clear();
    localStorage.setItem('juragan-nusantara:view', v);
  }, view);
  await page.reload();
  await page.getByRole('button', { name: 'Lewati' }).click();
  await page.getByRole('button', { name: /Permainan Baru/ }).click();
  await page.getByRole('button', { name: '4', exact: true }).click();
  if (mode === 'kilat') {
    await page.getByRole('button', { name: /Kilat/ }).click();
    await page.locator('.kilat-opts input').fill(String(rounds));
  }
  if (dice === 'fisik') await page.getByRole('button', { name: /Dadu fisik/ }).click();
  await page.getByRole('button', { name: /Mulai Main/ }).click();
  await page.getByRole('button', { name: /Lempar Dadu|Masukkan Dadu/ }).waitFor();
}

const browser = await chromium.launch();
const errors = [];
let failed = false;
try {
  for (const viewport of [
    { width: 360, height: 780 },
    { width: 1366, height: 768 },
  ]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    // 1) Permainan Kilat penuh, 4 pemain, dadu digital, papan 3D (bawaan)
    await newGame(page, { mode: 'kilat', dice: 'digital', rounds: 4 });
    await page.locator('.board3d canvas').waitFor({ timeout: 20000 });
    log(`${viewport.width}px: papan 3D tampil`);
    const steps = await playUntilOver(page, 1500);
    log(`${viewport.width}px: permainan Kilat 4 pemain selesai dalam ${steps} langkah UI`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/e2e-${viewport.width}-gameover.png` });

    // 2) Simpan otomatis: main beberapa langkah, reload, lanjutkan
    await newGame(page, { mode: 'klasik', dice: 'digital' });
    for (let i = 0; i < 25; i++) {
      await step(page);
      await page.waitForTimeout(80);
    }
    const before = await page.locator('.topbar-turn').textContent();
    const logBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('juragan-nusantara:save:v1')).state.logSeq);
    await page.reload();
    const cont = page.getByRole('button', { name: /Lanjutkan Permainan/ });
    await cont.click();
    const after = await page.locator('.topbar-turn').textContent();
    const logAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('juragan-nusantara:save:v1')).state.logSeq);
    if (before !== after || logBefore !== logAfter) throw new Error(`Simpan otomatis gagal: "${before}" vs "${after}"`);
    log(`${viewport.width}px: lanjutkan setelah reload OK (${after?.trim()})`);

    // 3) Mode dadu fisik, sekaligus uji tampilan 2D (ringan)
    await newGame(page, { mode: 'kilat', dice: 'fisik', rounds: 2, view: '2d' });
    await page.locator('.board').waitFor();
    const steps2 = await playUntilOver(page, 800);
    log(`${viewport.width}px: permainan dengan dadu fisik selesai dalam ${steps2} langkah UI`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    if (overflow) throw new Error(`Ada scroll horizontal di lebar ${viewport.width}px`);
    await page.close();
  }
  if (errors.length) throw new Error(`Error di konsol browser: ${errors.slice(0, 3).join(' | ')}`);
  log('SEMUA TEST E2E LOLOS');
} catch (e) {
  failed = true;
  console.error('[e2e] GAGAL:', e.message);
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
