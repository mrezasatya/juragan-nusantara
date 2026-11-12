// Dekorasi suasana: laut beranimasi, pulau Nusantara di tengah papan, kapal pinisi,
// awan, dan properti pojok (MULAI, Hotel Prodeo, Warkop, sirene OTT).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, toon } from './materials.ts';
import { HALF, TILE_RECTS, TILE_TOP } from './layout3d.ts';
import { cardBackTexture, logoTexture } from './textures.ts';
import { Palm } from './Houses.tsx';

export function Ocean() {
  const ref = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(70, 70, 48, 48);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      pos.setY(i, Math.sin(x * 0.45 + t * 1.1) * 0.08 + Math.cos(z * 0.5 + t * 0.9) * 0.08);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  });
  return <mesh ref={ref} geometry={geo} position={[0, -0.75, 0]} material={toon('#2EA3C9')} receiveShadow />;
}

/** Pulau stilisasi: blob pipih hijau dengan pinggiran pasir. */
function Island({ p, s, rot = 0, trees = 1 }: { p: [number, number]; s: [number, number]; rot?: number; trees?: number }) {
  return (
    <group position={[p[0], 0.06, p[1]]} rotation={[0, rot, 0]}>
      <mesh scale={[s[0] * 1.12, 1, s[1] * 1.12]} material={toon(PALETTE.pasir)} receiveShadow>
        <cylinderGeometry args={[1, 1, 0.06, 18]} />
      </mesh>
      <mesh position={[0, 0.05, 0]} scale={[s[0], 1, s[1]]} material={toon('#6CC24A')} castShadow receiveShadow>
        <cylinderGeometry args={[0.92, 1, 0.1, 18]} />
      </mesh>
      {Array.from({ length: trees }, (_, k) => (
        <Palm key={k} p={[((k % 2) - 0.5) * s[0] * 0.8, 0.1, (Math.floor(k / 2) - 0.3) * s[1] * 0.5]} s={0.55} />
      ))}
    </group>
  );
}

function Pinisi({ radius = 2.2, speed = 0.25, y = 0.08, center = [0, 0.4] as [number, number], scale = 0.55 }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed;
    const g = ref.current;
    if (!g) return;
    g.position.set(center[0] + Math.cos(t) * radius * 1.35, y + Math.sin(clock.elapsedTime * 2) * 0.02, center[1] + Math.sin(t) * radius * 0.7);
    g.rotation.y = -t + Math.PI;
    g.rotation.z = Math.sin(clock.elapsedTime * 1.6) * 0.06;
  });
  return (
    <group ref={ref} scale={scale}>
      <mesh position={[0, 0.08, 0]} material={toon('#7A4A2A')} castShadow>
        <boxGeometry args={[0.24, 0.12, 0.8]} />
      </mesh>
      <mesh position={[0, 0.1, 0.44]} rotation={[0.5, 0, 0]} material={toon('#7A4A2A')}>
        <boxGeometry args={[0.2, 0.08, 0.2]} />
      </mesh>
      {[-0.15, 0.15].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <mesh position={[0, 0.45, 0]} material={toon('#5A3A22')}>
            <cylinderGeometry args={[0.012, 0.012, 0.7, 5]} />
          </mesh>
          <mesh position={[0.06, 0.48, 0]} rotation={[0, Math.PI / 2, 0]} material={toon('#FFF5E0')} castShadow>
            <coneGeometry args={[0.18, 0.5, 3]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.84, -0.15]} material={toon('#C0392B')}>
        <boxGeometry args={[0.01, 0.06, 0.1]} />
      </mesh>
    </group>
  );
}

function Cloud({ p, s }: { p: [number, number, number]; s: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.x = ((p[0] + clock.elapsedTime * 0.25 + 30) % 60) - 30;
  });
  const m = toon('#FFFFFF');
  return (
    <group ref={ref} position={p} scale={s}>
      <mesh material={m}>
        <sphereGeometry args={[0.8, 10, 8]} />
      </mesh>
      <mesh position={[0.8, -0.1, 0.1]} material={m}>
        <sphereGeometry args={[0.6, 10, 8]} />
      </mesh>
      <mesh position={[-0.8, -0.15, 0]} material={m}>
        <sphereGeometry args={[0.55, 10, 8]} />
      </mesh>
    </group>
  );
}

export function Sky() {
  return (
    <>
      <Cloud p={[-12, 6, -16]} s={1.6} />
      <Cloud p={[6, 7, -20]} s={2} />
      <Cloud p={[18, 5, -12]} s={1.3} />
      <Cloud p={[-20, 4.5, -8]} s={1.2} />
      <Pinisi radius={8.5} speed={0.05} y={-0.7} center={[0, 0]} scale={1.1} />
    </>
  );
}

/** Area tengah papan: laut kecil dengan pulau-pulau Nusantara, logo, dan tumpukan kartu. */
export function CenterSea() {
  const inner = HALF - 1.6 - 0.04;
  const logo = useMemo(() => logoTexture(), []);
  const nasib = useMemo(() => cardBackTexture('nasib'), []);
  const warga = useMemo(() => cardBackTexture('warga'), []);
  return (
    <group>
      <mesh position={[0, 0.07, 0]} material={toon('#3FB8D8')} receiveShadow>
        <boxGeometry args={[inner * 2, 0.04, inner * 2]} />
      </mesh>
      {/* Pulau-pulau besar Nusantara (stilisasi, barat → timur) */}
      <Island p={[-3.2, -1.6]} s={[1.1, 0.42]} rot={-0.6} trees={2} />
      <Island p={[-1.6, -0.95]} s={[1.0, 0.25]} rot={-0.08} trees={1} />
      <Island p={[-0.9, -2.4]} s={[0.85, 0.75]} trees={2} />
      <Island p={[1.0, -1.6]} s={[0.45, 0.6]} rot={0.4} trees={1} />
      <Island p={[0.9, -0.55]} s={[0.6, 0.18]} rot={0.05} trees={0} />
      <Island p={[3.2, -1.2]} s={[1.0, 0.5]} rot={0.15} trees={2} />
      <Island p={[2.2, -0.6]} s={[0.25, 0.15]} trees={0} />
      <Pinisi radius={1.2} speed={0.3} center={[1.8, -3.3]} />
      {/* Logo dibaringkan rata di atas laut supaya tidak menutupi dadu dari sudut kamera mana pun */}
      <mesh position={[0, 0.1, 0.75]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.2, 2.03]} />
        <meshBasicMaterial map={logo} transparent toneMapped={false} depthWrite={false} />
      </mesh>
      {/* Tumpukan kartu */}
      <CardStack p={[-1.1, 3.0]} map={nasib} rot={0.2} />
      <CardStack p={[1.1, 3.0]} map={warga} rot={-0.2} />
    </group>
  );
}

function CardStack({ p, map, rot }: { p: [number, number]; map: THREE.Texture; rot: number }) {
  return (
    <group position={[p[0], 0.09, p[1]]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.06, 0]} material={toon('#F4E9D3')} castShadow>
        <boxGeometry args={[0.7, 0.12, 1.0]} />
      </mesh>
      <mesh position={[0, 0.121, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.7, 1.0]} />
        <meshToonMaterial map={map} />
      </mesh>
    </group>
  );
}

/** Properti 3D di petak pojok, diletakkan di sudut dalam supaya tulisan tetap terbaca. */
export function CornerProps() {
  const at = (i: number, dx: number, dz: number): [number, number, number] => [TILE_RECTS[i].x + dx, TILE_TOP, TILE_RECTS[i].z + dz];
  return (
    <>
      {/* MULAI: panah hijau besar + tumpukan koin */}
      <group position={at(0, -0.35, -0.5)} rotation={[0, Math.PI / 2, 0]}>
        <mesh position={[0, 0.05, 0]} material={toon('#43A047')} castShadow>
          <boxGeometry args={[0.18, 0.08, 0.5]} />
        </mesh>
        <mesh position={[0, 0.05, -0.34]} rotation={[-Math.PI / 2, 0, 0]} material={toon('#43A047')} castShadow>
          <coneGeometry args={[0.2, 0.22, 3]} />
        </mesh>
      </group>
      <group position={at(0, 0.45, -0.5)}>
        {[0, 1, 2, 3].map((k) => (
          <mesh key={k} position={[0, 0.025 + k * 0.045, 0]} material={toon(PALETTE.kunyit, { emissive: '#4A3000' })} castShadow>
            <cylinderGeometry args={[0.13, 0.13, 0.04, 14]} />
          </mesh>
        ))}
      </group>
      {/* Hotel Prodeo: sel berjeruji dengan sofa */}
      <group position={at(10, 0.42, -0.42)}>
        <mesh position={[0, 0.06, 0]} material={toon('#7E57C2')} castShadow>
          <boxGeometry args={[0.4, 0.12, 0.18]} />
        </mesh>
        <mesh position={[0, 0.16, -0.08]} material={toon('#7E57C2')}>
          <boxGeometry args={[0.4, 0.14, 0.05]} />
        </mesh>
        {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((x) => (
          <mesh key={x} position={[x, 0.25, 0.2]} material={toon('#9E9E9E')} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.5, 5]} />
          </mesh>
        ))}
        <mesh position={[0, 0.5, 0.2]} material={toon('#9E9E9E')}>
          <boxGeometry args={[0.56, 0.03, 0.03]} />
        </mesh>
      </group>
      {/* Warkop: meja bundar, gelas kopi, dua bangku */}
      <group position={at(20, 0.42, 0.42)}>
        <mesh position={[0, 0.18, 0]} material={toon('#8D5A35')} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.03, 14]} />
        </mesh>
        <mesh position={[0, 0.09, 0]} material={toon('#5A3A22')}>
          <cylinderGeometry args={[0.025, 0.04, 0.18, 6]} />
        </mesh>
        {[-0.08, 0.08].map((x) => (
          <group key={x} position={[x, 0.22, 0.02]}>
            <mesh material={toon('#FFFFFF')}>
              <cylinderGeometry args={[0.03, 0.025, 0.06, 10]} />
            </mesh>
            <mesh position={[0, 0.03, 0]} material={toon('#3B2414')}>
              <cylinderGeometry args={[0.027, 0.027, 0.005, 10]} />
            </mesh>
          </group>
        ))}
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.07, 0]} material={toon('#C0392B')} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.14, 10]} />
          </mesh>
        ))}
      </group>
      <Siren position={at(30, -0.42, 0.42)} />
    </>
  );
}

function Siren({ position }: { position: [number, number, number] }) {
  const lamp = useRef<THREE.Mesh>(null);
  const beam = useRef<THREE.Group>(null);
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color: '#FF3B30', emissive: new THREE.Color('#FF0000'), emissiveIntensity: 0.6 }), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    mat.emissiveIntensity = 0.4 + (Math.sin(t * 8) > 0 ? 0.9 : 0.1);
    if (beam.current) beam.current.rotation.y = t * 4;
  });
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} material={toon('#37474F')} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.12, 12]} />
      </mesh>
      <mesh ref={lamp} position={[0, 0.2, 0]} material={mat} castShadow>
        <sphereGeometry args={[0.14, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <group ref={beam} position={[0, 0.24, 0]}>
        <mesh position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.12, 0.6, 10, 1, true]} />
          <meshBasicMaterial color="#FF5A4F" transparent opacity={0.28} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
