import { isOwnable, TILES } from '../engine/data.ts';
import type { GameState } from '../engine/types.ts';

// Kejadian visual/suara yang diturunkan dari perbedaan dua state permainan.
// Efek ditahan sampai pion selesai berjalan, supaya terasa sinkron dengan apa yang dilihat pemain.

export type FxEvent =
  | { id: number; at: number; kind: 'money'; player: string; amount: number }
  | { id: number; at: number; kind: 'buy'; player: string; tile: number }
  | { id: number; at: number; kind: 'build'; player: string; tile: number; level: number }
  | { id: number; at: number; kind: 'jail'; player: string }
  | { id: number; at: number; kind: 'bankrupt'; player: string }
  | { id: number; at: number; kind: 'card'; player: string }
  | { id: number; at: number; kind: 'win'; player: string }
  | { id: number; at: number; kind: 'turn'; player: string };

type Draft = FxEvent extends infer E ? (E extends FxEvent ? Omit<E, 'id' | 'at'> : never) : never;

export function diffEvents(prev: GameState, next: GameState): Draft[] {
  const out: Draft[] = [];
  for (const p of next.players) {
    const q = prev.players.find((x) => x.id === p.id);
    if (!q) continue;
    if (p.cash !== q.cash && !p.bankrupt) out.push({ kind: 'money', player: p.id, amount: p.cash - q.cash });
    if (p.inJail && !q.inJail) out.push({ kind: 'jail', player: p.id });
    if (p.bankrupt && !q.bankrupt) out.push({ kind: 'bankrupt', player: p.id });
  }
  for (const t of TILES) {
    if (!isOwnable(t)) continue;
    const a = prev.board[t.index];
    const b = next.board[t.index];
    if (!a || !b || !b.owner) continue;
    if (!a.owner && b.owner) out.push({ kind: 'buy', player: b.owner, tile: t.index });
    else if (b.level > a.level && a.owner === b.owner) out.push({ kind: 'build', player: b.owner, tile: t.index, level: b.level });
  }
  if (next.lastCard && next.lastCard.seq !== prev.lastCard?.seq) out.push({ kind: 'card', player: next.lastCard.player });
  if (next.phase === 'gameOver' && prev.phase !== 'gameOver' && next.winner) out.push({ kind: 'win', player: next.winner });
  else if (next.current !== prev.current && next.phase !== 'gameOver') out.push({ kind: 'turn', player: next.players[next.current].id });
  return out;
}

let seq = 0;
export function stamp(drafts: Draft[]): FxEvent[] {
  const now = performance.now();
  return drafts.map((d) => ({ ...d, id: ++seq, at: now }) as FxEvent);
}
