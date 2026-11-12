import { createGame, reduce, moneyBalance } from './engine.ts';
import type { Action, GameState } from './types.ts';

export function newGame(n = 4, mode: 'klasik' | 'kilat' = 'klasik', seed = 42): GameState {
  return createGame({
    players: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, token: 'becak', color: '#000' })),
    mode,
    seed,
    kilatRounds: mode === 'kilat' ? 5 : null,
  });
}

/** Jalankan beberapa aksi berurutan dan pastikan konservasi uang terjaga di setiap langkah. */
export function act(s: GameState, ...actions: Action[]): GameState {
  for (const a of actions) {
    s = reduce(s, a);
    if (moneyBalance(s) !== 0) throw new Error(`Uang tidak seimbang setelah ${a.type}: ${moneyBalance(s)}`);
    for (const p of s.players) if (p.cash < 0) throw new Error(`Uang ${p.name} negatif setelah ${a.type}`);
  }
  return s;
}

/** Ubah state secara langsung untuk menyiapkan skenario (hanya untuk test). */
export function setup(s: GameState, fn: (d: GameState) => void): GameState {
  const d = structuredClone(s);
  const before = moneyBalance(d);
  fn(d);
  // Selisih uang yang disuntikkan dicatat ke neraca Bank supaya invariant tetap 0.
  d.bank -= moneyBalance(d) - before;
  return d;
}

export function own(s: GameState, playerId: string, tiles: number[], level = 0): GameState {
  return setup(s, (d) => {
    for (const t of tiles) d.board[t] = { owner: playerId, level, mortgaged: false };
  });
}

export function stackDeck(s: GameState, deck: 'nasib' | 'warga', cards: string[]): GameState {
  return setup(s, (d) => {
    d.decks[deck].draw = [...cards, ...d.decks[deck].draw.filter((c) => !cards.includes(c))];
    d.decks[deck].discard = d.decks[deck].discard.filter((c) => !cards.includes(c));
  });
}

export const cash = (s: GameState, id: string) => s.players.find((p) => p.id === id)!.cash;
export const pl = (s: GameState, id: string) => s.players.find((p) => p.id === id)!;
