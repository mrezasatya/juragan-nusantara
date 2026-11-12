// Simulator: menjalankan banyak permainan antar-bot tanpa UI untuk menguji
// kestabilan engine dan memberi gambaran keseimbangan ekonomi (Bagian 10 & 12).

import { botAction } from '../engine/bot.ts';
import { createGame, moneyBalance, reduce } from '../engine/engine.ts';
import type { GameMode, GameState } from '../engine/types.ts';

export interface SimResult {
  seed: number;
  finished: boolean;
  rounds: number;
  turns: number;
  actions: number;
  bankrupt: number;
  winnerWorth: number;
  maxWarkop: number;
  maxArisan: number;
  cardDraws: Record<string, number>;
  error?: string;
}

export function simulate(seed: number, players: number, mode: GameMode, maxRounds: number | null, actionCap = 60_000): SimResult {
  let s: GameState = createGame({
    players: Array.from({ length: players }, (_, i) => ({ name: `Bot${i + 1}`, token: 'becak', color: '#000' })),
    mode,
    seed,
    kilatRounds: mode === 'kilat' ? maxRounds : null,
  });
  const res: SimResult = {
    seed,
    finished: false,
    rounds: 0,
    turns: 0,
    actions: 0,
    bankrupt: 0,
    winnerWorth: 0,
    maxWarkop: 0,
    maxArisan: 0,
    cardDraws: {},
  };
  let lastCardSeq = -1;
  try {
    while (s.phase !== 'gameOver' && res.actions < actionCap) {
      s = reduce(s, botAction(s));
      res.actions += 1;
      if (moneyBalance(s) !== 0) throw new Error(`uang tidak seimbang: ${moneyBalance(s)}`);
      if (s.players.some((p) => p.cash < 0)) throw new Error('uang pemain negatif');
      if (s.warkop < 0 || s.arisan < 0) throw new Error('kas negatif');
      res.maxWarkop = Math.max(res.maxWarkop, s.warkop);
      res.maxArisan = Math.max(res.maxArisan, s.arisan);
      if (s.lastCard && s.lastCard.seq !== lastCardSeq) {
        lastCardSeq = s.lastCard.seq;
        res.cardDraws[s.lastCard.cardId] = (res.cardDraws[s.lastCard.cardId] ?? 0) + 1;
      }
    }
  } catch (e) {
    res.error = (e as Error).message;
  }
  res.finished = s.phase === 'gameOver';
  res.rounds = s.round;
  res.turns = s.turnCount;
  res.bankrupt = s.players.filter((p) => p.bankrupt).length;
  return res;
}

export function summarize(results: SimResult[]) {
  const n = results.length;
  const avg = (f: (r: SimResult) => number) => Math.round((results.reduce((a, r) => a + f(r), 0) / n) * 10) / 10;
  const sorted = (f: (r: SimResult) => number) => results.map(f).sort((a, b) => a - b);
  const pct = (arr: number[], p: number) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
  const rounds = sorted((r) => r.rounds);
  return {
    games: n,
    errors: results.filter((r) => r.error).length,
    finished: results.filter((r) => r.finished).length,
    avgRounds: avg((r) => r.rounds),
    medianRounds: pct(rounds, 0.5),
    p90Rounds: pct(rounds, 0.9),
    avgTurns: avg((r) => r.turns),
    avgBankrupt: avg((r) => r.bankrupt),
    avgMaxWarkop: avg((r) => r.maxWarkop),
    avgMaxArisan: avg((r) => r.maxArisan),
  };
}
