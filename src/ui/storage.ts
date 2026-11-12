import type { GameState } from '../engine/types.ts';

const KEY = 'juragan-nusantara:save:v1';
const TUTORIAL_KEY = 'juragan-nusantara:tutorial-seen';
const SETUP_KEY = 'juragan-nusantara:last-setup';

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

export function saveGame(s: GameState) {
  safe(() => localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), state: s })), undefined);
}
export function loadGame(): GameState | null {
  return safe(() => {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.state?.version === 1 ? (data.state as GameState) : null;
  }, null);
}
export function clearGame() {
  safe(() => localStorage.removeItem(KEY), undefined);
}
export const tutorialSeen = () => safe(() => localStorage.getItem(TUTORIAL_KEY) === '1', false);
export const markTutorialSeen = () => safe(() => localStorage.setItem(TUTORIAL_KEY, '1'), undefined);
export function saveSetup(v: unknown) {
  safe(() => localStorage.setItem(SETUP_KEY, JSON.stringify(v)), undefined);
}
export function loadSetup<T>(): T | null {
  return safe(() => JSON.parse(localStorage.getItem(SETUP_KEY) ?? 'null') as T | null, null);
}

/** Dadu digital memakai pengacak kriptografis bawaan browser. */
export function cryptoDie(): number {
  const buf = new Uint32Array(1);
  // Tolak sampel di ujung rentang supaya peluang 1–6 benar-benar sama.
  const limit = Math.floor(0xffffffff / 6) * 6;
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return (buf[0] % 6) + 1;
}
export function cryptoSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] | 0;
}
