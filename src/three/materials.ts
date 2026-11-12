import * as THREE from 'three';

// Shading kartun 3 tingkat (cel-shading) agar tampil seperti game konsol bergaya kartun.
let gradient: THREE.DataTexture | null = null;
export function toonGradient(): THREE.DataTexture {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

const cache = new Map<string, THREE.MeshToonMaterial>();
/** Material toon yang di-cache per warna (hemat memori, banyak mesh berbagi material). */
export function toon(color: string, opts: { emissive?: string; transparent?: boolean; opacity?: number } = {}) {
  const key = `${color}|${opts.emissive ?? ''}|${opts.opacity ?? 1}`;
  let m = cache.get(key);
  if (!m) {
    m = new THREE.MeshToonMaterial({
      color,
      gradientMap: toonGradient(),
      emissive: opts.emissive ? new THREE.Color(opts.emissive) : undefined,
      transparent: opts.transparent ?? false,
      opacity: opts.opacity ?? 1,
    });
    cache.set(key, m);
  }
  return m;
}

export const PALETTE = {
  krem: '#F4E9D3',
  kertas: '#FFF8EA',
  jati: '#6B4226',
  jatiTua: '#4A2C18',
  bata: '#B5442C',
  kunyit: '#E3A21A',
  pandan: '#4E8B3A',
  laut: '#1F5F8B',
  lautMuda: '#2EA3C9',
  pasir: '#F2D49B',
  daun: '#5DBB4A',
  ijuk: '#3A2A20',
  jerami: '#D9B45A',
  putih: '#FFFFFF',
  genteng: '#C8572B',
};
