// Efek visual 3D: teks melayang (+Rp / −Rp), ledakan partikel (koin, konfeti),
// dan animasi "muncul memantul" untuk bangunan baru.

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { rp } from '../engine/format.ts';
import { toon } from './materials.ts';

/** Teks melayang di atas posisi tertentu (DOM, dianimasikan dengan CSS). */
export function FloatingText({ position, text, tone }: { position: [number, number, number]; text: string; tone: 'plus' | 'minus' | 'info' }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`fx-float fx-${tone}`}>{text}</div>
    </Html>
  );
}

export const moneyText = (amount: number) => `${amount > 0 ? '+' : '−'}${rp(Math.abs(amount))}`;

interface BurstProps {
  origin: [number, number, number];
  count: number;
  kind: 'coin' | 'confetti';
  colors?: string[];
  spread?: number;
  up?: number;
  life?: number;
  gravity?: number;
  /** Untuk hujan konfeti: partikel mulai dari ketinggian & area luas. */
  rain?: { area: number; height: number };
}

/** Ledakan partikel dengan InstancedMesh (hemat: satu draw call per ledakan). */
export function Burst({ origin, count, kind, colors = ['#E3A21A'], spread = 1.6, up = 3.2, life = 1.6, gravity = 7, rain }: BurstProps) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const t0 = useRef<number | null>(null);
  const parts = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const a = Math.random() * Math.PI * 2;
        const s = (0.3 + Math.random() * 0.7) * spread;
        return {
          p: rain
            ? new THREE.Vector3(origin[0] + (Math.random() - 0.5) * rain.area, origin[1] + rain.height * (0.6 + Math.random() * 0.6), origin[2] + (Math.random() - 0.5) * rain.area)
            : new THREE.Vector3(...origin),
          v: rain
            ? new THREE.Vector3((Math.random() - 0.5) * 0.6, -0.4 - Math.random() * 0.6, (Math.random() - 0.5) * 0.6)
            : new THREE.Vector3(Math.cos(a) * s, up * (0.7 + Math.random() * 0.5), Math.sin(a) * s),
          r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
          w: new THREE.Vector3((Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14),
        };
      }),
    // Sengaja dihitung sekali saat dipasang: tiap ledakan adalah komponen baru (key = id kejadian).
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const geo = useMemo(
    () => (kind === 'coin' ? new THREE.CylinderGeometry(0.07, 0.07, 0.02, 12) : new THREE.PlaneGeometry(0.07, 0.11)),
    [kind],
  );
  const mat = useMemo(
    () =>
      kind === 'coin'
        ? new THREE.MeshToonMaterial({ color: '#F2C230', emissive: new THREE.Color('#5A3C00') })
        : new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: false }),
    [kind],
  );
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    if (kind === 'confetti') {
      const c = new THREE.Color();
      for (let i = 0; i < count; i++) m.setColorAt(i, c.set(colors[i % colors.length]));
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [count, colors, kind]);
  useEffect(() => () => {
    geo.dispose();
    mat.dispose();
  }, [geo, mat]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, rawDt) => {
    const m = ref.current;
    if (!m) return;
    const dt = Math.min(rawDt, 0.05);
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const age = state.clock.elapsedTime - t0.current;
    const fade = Math.max(0, 1 - Math.max(0, age - life * 0.7) / (life * 0.3));
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i];
      const g = kind === 'confetti' ? gravity * 0.25 : gravity;
      q.v.y -= g * dt;
      if (kind === 'confetti') q.v.multiplyScalar(0.985);
      q.p.addScaledVector(q.v, dt);
      if (q.p.y < 0.17) {
        q.p.y = 0.17;
        q.v.set(q.v.x * 0.4, Math.abs(q.v.y) * 0.25, q.v.z * 0.4);
      }
      q.r.x += q.w.x * dt;
      q.r.y += q.w.y * dt;
      q.r.z += q.w.z * dt;
      dummy.position.copy(q.p);
      dummy.rotation.copy(q.r);
      dummy.scale.setScalar(fade);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, count]} castShadow={kind === 'coin'} frustumCulled={false} />;
}

/** Anak-anaknya muncul dengan skala memantul (elastic) saat pertama kali dipasang. */
export function PopIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(-delay);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g || t.current > 1) return;
    t.current += Math.min(dt, 0.05) / 0.55;
    const x = Math.max(0, Math.min(1, t.current));
    // easeOutBack
    const c1 = 1.9;
    const s = x <= 0 ? 0.001 : 1 + (c1 + 1) * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    g.scale.setScalar(Math.max(0.001, s));
  });
  return (
    <group ref={ref} scale={0.001}>
      {children}
    </group>
  );
}

/** Kepulan debu saat bangunan berdiri. */
export function Puff({ origin }: { origin: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    t.current += Math.min(dt, 0.05);
    const k = t.current / 0.8;
    g.scale.setScalar(0.4 + k * 1.4);
    g.visible = k < 1;
    g.children.forEach((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = Math.max(0, 0.55 * (1 - k));
    });
  });
  const mats = useMemo(
    () => Array.from({ length: 6 }, () => new THREE.MeshBasicMaterial({ color: '#F4E9D3', transparent: true, opacity: 0.55, depthWrite: false })),
    [],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  return (
    <group ref={ref} position={origin}>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <mesh key={k} position={[Math.cos(k) * 0.18, 0.05 + (k % 2) * 0.05, Math.sin(k) * 0.18]} material={mats[k]}>
          <sphereGeometry args={[0.1, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
}

export const CONFETTI_COLORS = ['#C0392B', '#E3A21A', '#3E8B3A', '#1F5F8B', '#D2557F', '#FFFFFF', '#7B4FA0'];
export { toon };
