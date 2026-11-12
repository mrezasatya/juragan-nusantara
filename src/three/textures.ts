import * as THREE from 'three';
import { GROUP_BY_ID, TILES, isOwnable } from '../engine/data.ts';
import { rp } from '../engine/format.ts';
import { TILE_RECTS } from './layout3d.ts';

// Tekstur permukaan petak digambar dengan Canvas 2D (ikon, nama, harga, pita warna),
// tanpa memuat font/asset dari luar sehingga tetap jalan offline.

const PX = 128; // piksel per 1 unit dunia

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

const BG: Record<string, string> = {
  card: '#E8F1FA',
  goToJail: '#FBD9CF',
  pungli: '#FBD9CF',
  warkop: '#F8E6C2',
  start: '#FFE9A8',
  jail: '#E9DCC6',
  tax: '#FFF1DC',
};

export function makeTileTexture(index: number, opts: { mortgaged?: boolean } = {}): THREE.CanvasTexture {
  const t = TILES[index];
  const r = TILE_RECTS[index];
  const W = Math.round(r.w * PX);
  const H = Math.round(r.d * PX);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = BG[t.kind] ?? '#FFF8EA';
  ctx.fillRect(0, 0, W, H);

  // Pita warna grup di sisi dalam petak
  let pad = { t: 0, b: 0, l: 0, r: 0 };
  if (t.kind === 'property') {
    ctx.fillStyle = GROUP_BY_ID[t.group].color;
    const band = 0.26 * PX;
    if (r.side === 'bottom') {
      ctx.fillRect(0, 0, W, band);
      pad.t = band;
    } else if (r.side === 'top') {
      ctx.fillRect(0, H - band, W, band);
      pad.b = band;
    } else if (r.side === 'left') {
      ctx.fillRect(W - band, 0, band, H);
      pad.r = band;
    } else {
      ctx.fillRect(0, 0, band, H);
      pad.l = band;
    }
  }
  // Bingkai
  ctx.strokeStyle = 'rgba(107,66,38,0.55)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  const cx = (pad.l + (W - pad.r)) / 2;
  const top = pad.t;
  const availH = H - pad.t - pad.b;
  const availW = W - pad.l - pad.r - 10;
  const corner = r.side === 'corner';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const iconSize = corner ? 78 : Math.min(48, availH * 0.4);
  ctx.font = `${iconSize}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  const iconY = top + availH * (corner ? 0.38 : 0.3);
  ctx.fillText(t.icon, cx, iconY);

  const name = t.kind === 'property' ? t.landmark : t.short;
  const fs = corner ? 26 : 18;
  ctx.font = `800 ${fs}px Nunito, "Trebuchet MS", sans-serif`;
  ctx.fillStyle = '#3B2414';
  const lines = wrapText(ctx, name, availW);
  let y = top + availH * (corner ? 0.72 : 0.58) - ((lines.length - 1) * fs * 1.05) / 2;
  for (const ln of lines) {
    ctx.fillText(ln, cx, y);
    y += fs * 1.05;
  }
  let sub = '';
  if (isOwnable(t)) sub = rp(t.price);
  else if (t.kind === 'tax') sub = t.percent ? 'Rp 200 jt / 10%' : rp(t.amount);
  if (sub) {
    ctx.font = `800 ${corner ? 18 : 15}px Nunito, sans-serif`;
    ctx.fillStyle = '#8A5A3A';
    ctx.fillText(sub, cx, Math.min(H - pad.b - 10, y + 4));
  }
  if (opts.mortgaged) {
    ctx.fillStyle = 'rgba(60,40,30,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#B5442C';
    ctx.fillRect(-W / 2, -14, W, 28);
    ctx.fillStyle = '#fff';
    ctx.font = '900 18px Nunito, sans-serif';
    ctx.fillText('GADAI', 0, 1);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Tekstur sisi dadu dengan titik (pip). */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.27, 0.22], [0.73, 0.22], [0.27, 0.5], [0.73, 0.5], [0.27, 0.78], [0.73, 0.78]],
};
const dieCache = new Map<number, THREE.CanvasTexture>();
export function dieFaceTexture(v: number): THREE.CanvasTexture {
  const hit = dieCache.get(v);
  if (hit) return hit;
  const S = 128;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#FFFDF5';
  ctx.fillRect(0, 0, S, S);
  for (const [x, y] of PIPS[v]) {
    ctx.beginPath();
    ctx.arc(x * S, y * S, S * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = v === 1 ? '#C0392B' : '#3B2414';
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  dieCache.set(v, tex);
  return tex;
}

/** Papan nama/logo di tengah papan. */
export function logoTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 400;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '160px "Lilita One", "Trebuchet MS", sans-serif';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#4A2C18';
  ctx.strokeText('Juragan', W / 2, 110);
  ctx.fillStyle = '#E3A21A';
  ctx.fillText('Juragan', W / 2, 110);
  ctx.strokeText('Nusantara', W / 2, 260);
  ctx.fillStyle = '#C0392B';
  ctx.fillText('Nusantara', W / 2, 260);
  ctx.font = 'italic 700 42px Nunito, sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.strokeText('Borong Nusantara, asal kuat bayar iuran.', W / 2, 360);
  ctx.fillStyle = '#4A2C18';
  ctx.fillText('Borong Nusantara, asal kuat bayar iuran.', W / 2, 360);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Punggung kartu (Nasib: gunungan wayang, Warga: kentongan) — versi sederhana. */
export function cardBackTexture(deck: 'nasib' | 'warga'): THREE.CanvasTexture {
  const W = 256;
  const H = 360;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = deck === 'nasib' ? '#B5442C' : '#1F5F8B';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#E3A21A';
  ctx.lineWidth = 8;
  ctx.setLineDash([16, 10]);
  ctx.strokeRect(16, 16, W - 32, H - 32);
  ctx.setLineDash([]);
  ctx.fillStyle = '#6B4226';
  ctx.strokeStyle = '#E3A21A';
  ctx.lineWidth = 6;
  if (deck === 'nasib') {
    ctx.beginPath();
    ctx.moveTo(128, 50);
    ctx.bezierCurveTo(190, 120, 205, 200, 200, 240);
    ctx.bezierCurveTo(195, 290, 160, 310, 128, 315);
    ctx.bezierCurveTo(96, 310, 61, 290, 56, 240);
    ctx.bezierCurveTo(51, 200, 66, 120, 128, 50);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 90);
    ctx.lineTo(128, 290);
    for (const y of [140, 190, 240]) {
      ctx.moveTo(128, y);
      ctx.lineTo(95, y + 28);
      ctx.moveTo(128, y);
      ctx.lineTo(161, y + 28);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(40, 150);
    ctx.lineTo(128, 80);
    ctx.lineTo(216, 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(60, 150, 14, 150);
    ctx.fillRect(182, 150, 14, 150);
    ctx.fillStyle = '#E3A21A';
    ctx.fillRect(108, 170, 40, 90);
    ctx.fillStyle = '#6B4226';
    ctx.fillRect(122, 185, 12, 60);
  }
  ctx.fillStyle = '#fff';
  ctx.font = '800 30px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(deck === 'nasib' ? 'NASIB' : 'WARGA', 128, 345);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
