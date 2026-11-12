// Galeri 3D: 8 rumah adat (per grup wilayah) dan 8 karakter pion, berputar pelan.
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GROUPS } from '../engine/data.ts';
import { TOKENS } from '../ui/constants.ts';
import { HOUSE_NAMES, RegionalHouse, Resort } from './Houses.tsx';
import Pawn from './Pawn.tsx';
import { toon } from './materials.ts';

function Spinner({ children, x, z = 0 }: { children: React.ReactNode; x: number; z?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.45;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, -0.08, 0]} material={toon('#F1DDB4')} receiveShadow>
        <cylinderGeometry args={[0.75, 0.8, 0.16, 24]} />
      </mesh>
      <group ref={ref}>{children}</group>
    </group>
  );
}

export default function Gallery3D({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'rumah' | 'resort' | 'pion'>('rumah');
  const items = tab === 'pion' ? TOKENS.map((t) => ({ key: t.id, title: t.label, sub: '' })) : GROUPS.map((g) => ({ key: g.id, title: HOUSE_NAMES[g.id], sub: `Grup ${g.name} · ${g.region}` }));
  const cols = 4;
  const pos = (i: number): [number, number] => [((i % cols) - (cols - 1) / 2) * 1.9, Math.floor(i / cols) * 2.1 - 1.05];
  return (
    <div className="gallery">
      <header className="gallery-head">
        <button className="btn btn-ghost" onClick={onClose}>
          ← Kembali
        </button>
        <h1>Galeri 3D</h1>
        <div className="seg">
          <button className={tab === 'rumah' ? 'on' : ''} onClick={() => setTab('rumah')}>
            Rumah adat
          </button>
          <button className={tab === 'resort' ? 'on' : ''} onClick={() => setTab('resort')}>
            Resort
          </button>
          <button className={tab === 'pion' ? 'on' : ''} onClick={() => setTab('pion')}>
            Pion
          </button>
        </div>
      </header>
      <div className="gallery-canvas">
        <Canvas shadows flat dpr={[1, 2]} camera={{ fov: 35, position: [0, 4.2, 8.5] }}>
          <hemisphereLight args={['#DFF4FF', '#F2D49B', 1.5]} />
          <directionalLight position={[4, 8, 6]} intensity={2.6} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
          {items.map((it, i) => {
            const [x, z] = pos(i);
            return (
              <Spinner key={`${tab}-${it.key}`} x={x} z={z}>
                {tab === 'rumah' && <RegionalHouse group={it.key as (typeof GROUPS)[number]['id']} />}
                {tab === 'resort' && (
                  <group scale={0.95}>
                    <Resort group={it.key as (typeof GROUPS)[number]['id']} color="#C0392B" />
                  </group>
                )}
                {tab === 'pion' && (
                  <group scale={1.6}>
                    <Pawn id={it.key} token={it.key} color={['#C0392B', '#1F5F8B', '#3E8B3A', '#D99A0B', '#7B4FA0', '#D2557F', '#C0392B', '#1F5F8B'][i]} target={[0, 0]} stepMs={300} active={false} jailed={false} />
                  </group>
                )}
              </Spinner>
            );
          })}
          <OrbitControls enablePan={false} minDistance={4} maxDistance={16} target={[0, 0.3, 0]} />
        </Canvas>
      </div>
      <ol className="gallery-legend">
        {items.map((it) => (
          <li key={it.key}>
            <strong>{it.title}</strong>
            {it.sub && <span>{it.sub}</span>}
          </li>
        ))}
      </ol>
      <p className="hint gallery-note">
        Model 3D disederhanakan (gaya low-poly) dan terinspirasi dari bentuk khas rumah adat tiap wilayah; bukan rekonstruksi arsitektur yang presisi.
      </p>
    </div>
  );
}
