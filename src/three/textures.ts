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

/** Logo pita merah-emas: "JURAGAN NUSANTARA" + pita tagline. */
export function logoTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 420;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const banner = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };
  // Pita bawah (tagline) dengan ujung berlekuk
  ctx.fillStyle = '#8A5A2A';
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 140 : W - 140;
    ctx.beginPath();
    ctx.moveTo(x0, 300);
    ctx.lineTo(x0 + side * 110, 300);
    ctx.lineTo(x0 + side * 80, 340);
    ctx.lineTo(x0 + side * 110, 380);
    ctx.lineTo(x0, 380);
    ctx.closePath();
    ctx.fill();
  }
  banner(150, 292, W - 300, 92, 18);
  ctx.fillStyle = '#F6E3B4';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#B8862B';
  ctx.stroke();
  ctx.fillStyle = '#5A3A22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Ukuran huruf menyesuaikan lebar pita supaya tidak terpotong
  const tagline = 'Borong Nusantara · Asal Kuat Bayar Iuran';
  let fs = 44;
  do {
    ctx.font = `800 ${fs}px Nunito, "Trebuchet MS", sans-serif`;
    fs -= 2;
  } while (ctx.measureText(tagline).width > W - 360 && fs > 20);
  ctx.fillText(tagline, W / 2, 340);
  // Pita utama merah
  banner(40, 30, W - 80, 260, 60);
  const g = ctx.createLinearGradient(0, 30, 0, 290);
  g.addColorStop(0, '#E0503A');
  g.addColorStop(1, '#A92A1B');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#E8B23A';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFF0B8';
  banner(58, 48, W - 116, 224, 46);
  ctx.stroke();
  // Teks
  ctx.lineJoin = 'round';
  ctx.font = '96px "Lilita One", "Trebuchet MS", sans-serif';
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#5A1A10';
  ctx.strokeText('JURAGAN', W / 2, 108);
  ctx.fillStyle = '#FFD45A';
  ctx.fillText('JURAGAN', W / 2, 108);
  ctx.font = '120px "Lilita One", "Trebuchet MS", sans-serif';
  ctx.lineWidth = 18;
  ctx.strokeText('NUSANTARA', W / 2, 212);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('NUSANTARA', W / 2, 212);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Serat kayu meja. */
export function woodTexture(): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const ctx = c.getContext('2d')!;
  const plank = S / 4;
  for (let i = 0; i < 4; i++) {
    const base = ['#9A5F34', '#A86A3B', '#925A30', '#A26539'][i];
    ctx.fillStyle = base;
    ctx.fillRect(0, i * plank, S, plank);
    for (let k = 0; k < 14; k++) {
      ctx.strokeStyle = `rgba(60,30,12,${0.08 + Math.random() * 0.12})`;
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      const y = i * plank + Math.random() * plank;
      ctx.moveTo(0, y);
      for (let x = 0; x <= S; x += 32) ctx.lineTo(x, y + Math.sin(x / 60 + k) * 3);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(50,25,10,0.55)';
    ctx.fillRect(0, i * plank, S, 3);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = 8;
  return tex;
}

/** Uang mainan (desain netral, tanpa lambang negara). */
export function billTexture(label: string, color: string): THREE.CanvasTexture {
  const W = 256;
  const H = 128;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, W - 16, H - 16);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(60, 64, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(60,40,20,0.7)';
  ctx.font = '900 30px "Lilita One", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JN', 60, 66);
  ctx.fillStyle = '#2B1A10';
  ctx.font = '900 34px Nunito, sans-serif';
  ctx.fillText(label, 168, 66);
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

// ===== Tekstur kain & properti karakter =====
const clothCache = new Map<string, THREE.CanvasTexture>();
function canvasTex(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const hit = clothCache.get(key);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  clothCache.set(key, t);
  return t;
}

/** Batik coklat (parang/kawung sederhana) untuk kain jarik. */
export function batikTexture() {
  return canvasTex('batik', 128, 128, (ctx) => {
    ctx.fillStyle = '#7A4A22';
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = '#E9C27A';
    ctx.lineWidth = 5;
    for (let i = -128; i < 256; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 128, 128);
      ctx.stroke();
    }
    ctx.fillStyle = '#3B2210';
    for (let y = 16; y < 128; y += 32)
      for (let x = 16; x < 128; x += 32) {
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
  }, [2, 2]);
}

/** Kebaya ungu bermotif bunga. */
export function kebayaTexture() {
  return canvasTex('kebaya', 128, 128, (ctx) => {
    ctx.fillStyle = '#7B4FA0';
    ctx.fillRect(0, 0, 128, 128);
    for (let y = 12; y < 128; y += 30)
      for (let x = (y / 30) % 2 ? 26 : 10; x < 128; x += 32) {
        ctx.fillStyle = '#C9A6E3';
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#F2C230';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
  }, [2, 2]);
}

/** Sarung kotak-kotak ungu. */
export function sarungTexture() {
  return canvasTex('sarung', 128, 128, (ctx) => {
    ctx.fillStyle = '#6A4C93';
    ctx.fillRect(0, 0, 128, 128);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = '#B9A3D9';
    for (let i = 0; i < 128; i += 32) {
      ctx.fillRect(i, 0, 10, 128);
      ctx.fillRect(0, i, 128, 10);
    }
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#2E1F45';
    for (let i = 18; i < 128; i += 32) {
      ctx.fillRect(i, 0, 4, 128);
      ctx.fillRect(0, i, 128, 4);
    }
  }, [2, 2]);
}

/** Papan nama "KOS". */
export function kosSignTexture() {
  return canvasTex('kos', 128, 72, (ctx) => {
    ctx.fillStyle = '#8A5A35';
    ctx.fillRect(0, 0, 128, 72);
    ctx.strokeStyle = '#5A3A22';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 122, 66);
    ctx.fillStyle = '#FFF3DD';
    ctx.font = '900 44px Nunito, "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KOS', 64, 39);
  });
}
