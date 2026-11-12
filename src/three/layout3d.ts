// Koordinat dunia 3D papan. Papan di bidang XZ, sumbu -Z = "atas" papan (arah utara di layar).
import { CORNER, TOTAL, gridPos, type Side } from '../ui/geometry.ts';

export const HALF = TOTAL / 2;
export const TILE_TOP = 0.16; // tinggi permukaan petak

function span(n: number): [number, number] {
  if (n === 1) return [0, CORNER];
  if (n === 11) return [CORNER + 9, CORNER];
  return [CORNER + (n - 2), 1];
}

export interface TileRect {
  x: number; // pusat
  z: number;
  w: number; // lebar (sumbu X)
  d: number; // dalam (sumbu Z)
  side: Side;
  /** Arah "ke tengah papan" dari petak ini (untuk pita warna & rumah). */
  inward: [number, number];
}

export function tileRect(i: number): TileRect {
  const { row, col, side } = gridPos(i);
  const [cx, cw] = span(col);
  const [rz, rd] = span(row);
  const inward: [number, number] =
    side === 'bottom' ? [0, -1] : side === 'top' ? [0, 1] : side === 'left' ? [1, 0] : side === 'right' ? [-1, 0] : [0, 0];
  return { x: cx + cw / 2 - HALF, z: rz + rd / 2 - HALF, w: cw, d: rd, side, inward };
}

export const TILE_RECTS = Array.from({ length: 40 }, (_, i) => tileRect(i));

/** Posisi berdiri pion di petak, dengan jarak jika beberapa pion di petak yang sama. */
export function standPoint(i: number, k: number, n: number): [number, number] {
  const r = TILE_RECTS[i];
  // Pion berdiri di bagian luar petak (jauh dari rumah yang ada di sisi dalam).
  const ox = -r.inward[0] * 0.18;
  const oz = -r.inward[1] * 0.18;
  if (n <= 1) return [r.x + ox, r.z + oz];
  const rad = n <= 2 ? 0.2 : n <= 4 ? 0.28 : 0.36;
  const a = (k / n) * Math.PI * 2 + Math.PI / 4;
  return [r.x + ox + Math.cos(a) * rad, r.z + oz + Math.sin(a) * rad];
}
