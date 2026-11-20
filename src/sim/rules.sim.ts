import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CONFIG } from '../engine/data.ts';
import { simulate, summarize, type SimResult } from './simulate.ts';
import { RULES_ON } from '../engine/engine.ts';

// Membandingkan aturan klasik vs Aturan Seru, dan batas renovasi tanpa grup lengkap.
const GAMES = Number(process.env.SIM_GAMES ?? 60);
const out: Record<string, unknown> = {};

function run(label: string, rules: typeof RULES_ON | undefined, cap?: number) {
  const prev = CONFIG.rules.visitUpgradeMaxLevelWithoutSet;
  if (cap !== undefined) CONFIG.rules.visitUpgradeMaxLevelWithoutSet = cap;
  const res: SimResult[] = [];
  for (let i = 0; i < GAMES; i++) res.push(simulate(3000 + i, 4, 'klasik', null, 40_000, rules));
  const cards = res.reduce((a, r) => a + Object.values(r.cardDraws).reduce((x, y) => x + y, 0), 0) / res.reduce((a, r) => a + r.turns, 0);
  out[label] = { ...summarize(res), kartuPerGiliran: Math.round(cards * 100) / 100 };
  CONFIG.rules.visitUpgradeMaxLevelWithoutSet = prev;
  expect(res.filter((r) => r.error)).toHaveLength(0);
}

describe('Aturan Seru', () => {
  it('klasik (semua mati)', () => run('klasik', undefined));
  it('seru, batas 2', () => run('seru_batas2', RULES_ON, 2));
  it('seru, batas 3', () => run('seru_batas3', RULES_ON, 3));
  it('seru, batas 4', () => run('seru_batas4', RULES_ON, 4));
  it('kilat 15 putaran: klasik vs seru', () => {
    for (const [label, rules] of [['kilat_klasik', undefined], ['kilat_seru', RULES_ON]] as const) {
      const res: SimResult[] = [];
      for (let i = 0; i < GAMES; i++) res.push(simulate(7000 + i, 4, 'kilat', 15, 40_000, rules));
      expect(res.filter((r) => r.error)).toHaveLength(0);
      const cards = res.reduce((a, r) => a + Object.values(r.cardDraws).reduce((x, y) => x + y, 0), 0) / res.reduce((a, r) => a + r.turns, 0);
      out[label] = { ...summarize(res), kartuPerGiliran: Math.round(cards * 100) / 100 };
    }
  });
  afterAll(() => writeFileSync(resolve(__dirname, '../../docs/simulasi-aturan-seru.json'), JSON.stringify({ games: GAMES, ...out }, null, 2) + '\n'));
});
