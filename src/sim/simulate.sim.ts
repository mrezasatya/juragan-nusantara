import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { simulate, summarize, type SimResult } from './simulate.ts';

const GAMES = Number(process.env.SIM_GAMES ?? 100);

describe('Simulator bot', () => {
  const report: Record<string, unknown> = {};

  for (const players of [2, 4, 6]) {
    it(`Mode Klasik, ${players} pemain — ${GAMES} permainan tanpa error`, () => {
      const results: SimResult[] = [];
      for (let i = 0; i < GAMES; i++) results.push(simulate(1000 + i, players, 'klasik', null, 30_000));
      const errs = results.filter((r) => r.error);
      if (errs.length) console.error(errs.slice(0, 3));
      expect(errs).toHaveLength(0);
      report[`klasik_${players}p`] = summarize(results);
    });
  }

  for (const rounds of [10, 15, 20]) {
    it(`Mode Kilat, 4 pemain, batas ${rounds} putaran`, () => {
      const results: SimResult[] = [];
      for (let i = 0; i < GAMES; i++) results.push(simulate(5000 + i, 4, 'kilat', rounds));
      expect(results.filter((r) => r.error)).toHaveLength(0);
      expect(results.every((r) => r.finished)).toBe(true);
      report[`kilat_4p_${rounds}r`] = summarize(results);
    });
  }

  it('frekuensi kartu muncul (Klasik 4 pemain)', () => {
    const draws: Record<string, number> = {};
    for (let i = 0; i < GAMES; i++) {
      const r = simulate(9000 + i, 4, 'klasik', null, 30_000);
      for (const [k, v] of Object.entries(r.cardDraws)) draws[k] = (draws[k] ?? 0) + v;
    }
    const ids = Object.keys(draws);
    expect(ids.length).toBe(100); // semua kartu pernah keluar
    report.cardDrawsMinMax = { min: Math.min(...Object.values(draws)), max: Math.max(...Object.values(draws)) };
  });

  afterAll(() => {
    console.log(JSON.stringify(report, null, 2));
    const dir = resolve(__dirname, '../../docs');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'simulasi-hasil.json'), JSON.stringify({ games: GAMES, ...report }, null, 2) + '\n');
  });
});
