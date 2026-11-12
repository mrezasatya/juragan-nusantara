// Geometri papan 11×11: petak 0 (MULAI) di pojok kanan bawah, berjalan searah jarum jam
// mengikuti rute Sabang → Merauke (bawah → kiri → atas → kanan).

export type Side = 'bottom' | 'left' | 'top' | 'right' | 'corner';

export function gridPos(i: number): { row: number; col: number; side: Side } {
  if (i === 0) return { row: 11, col: 11, side: 'corner' };
  if (i < 10) return { row: 11, col: 11 - i, side: 'bottom' };
  if (i === 10) return { row: 11, col: 1, side: 'corner' };
  if (i < 20) return { row: 11 - (i - 10), col: 1, side: 'left' };
  if (i === 20) return { row: 1, col: 1, side: 'corner' };
  if (i < 30) return { row: 1, col: 1 + (i - 20), side: 'top' };
  if (i === 30) return { row: 1, col: 11, side: 'corner' };
  return { row: 1 + (i - 30), col: 11, side: 'right' };
}

// Lebar kolom/baris: pojok 1,6 unit, petak biasa 1 unit → total 12,2 unit.
export const CORNER = 1.6;
export const TOTAL = CORNER * 2 + 9;

function span(n: number): [number, number] {
  if (n === 1) return [0, CORNER];
  if (n === 11) return [CORNER + 9, CORNER];
  return [CORNER + (n - 2), 1];
}

/** Titik tengah petak dalam persen terhadap papan. */
export function tileCenter(i: number): { x: number; y: number } {
  const { row, col } = gridPos(i);
  const [cx, cw] = span(col);
  const [ry, rh] = span(row);
  return { x: ((cx + cw / 2) / TOTAL) * 100, y: ((ry + rh / 2) / TOTAL) * 100 };
}

export const GRID_TEMPLATE = `${CORNER}fr repeat(9, 1fr) ${CORNER}fr`;
