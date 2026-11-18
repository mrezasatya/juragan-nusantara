// Dekorasi suasana: laut beranimasi, pulau Nusantara di tengah papan, kapal pinisi,
// awan, dan properti pojok (MULAI, Hotel Prodeo, Warkop, sirene OTT).

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, toon } from './materials.ts';
import { HALF, TILE_RECTS, TILE_TOP } from './layout3d.ts';
import { billTexture, cardBackTexture, logoTexture, woodTexture } from './textures.ts';
import { Palm, RegionalHouse } from './Houses.tsx';

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

/** Area tengah papan: laut kecil dengan pulau-pulau Nusantara dan landmark 3D, plus logo pita. */
export function CenterSea() {
  const inner = HALF - 1.6 - 0.04;
  const logo = useMemo(() => logoTexture(), []);
  return (
    <group>
      <mesh position={[0, 0.07, 0]} material={toon('#3FB8D8')} receiveShadow>
        <boxGeometry args={[inner * 2, 0.04, inner * 2]} />
      </mesh>
      {/* Pulau stilisasi, barat → timur */}
      <Island p={[-3.0, -2.0]} s={[1.3, 0.55]} rot={-0.6} trees={0} />
      <Island p={[-1.0, -0.95]} s={[1.3, 0.34]} rot={-0.05} trees={0} />
      <Island p={[-0.7, -2.95]} s={[0.95, 0.8]} trees={0} />
      <Island p={[1.25, -2.2]} s={[0.55, 0.72]} rot={0.35} trees={0} />
      <Island p={[1.15, -0.8]} s={[0.8, 0.22]} rot={0.04} trees={0} />
      <Island p={[2.35, -1.35]} s={[0.3, 0.22]} trees={1} />
      <Island p={[3.3, -1.9]} s={[1.05, 0.58]} rot={0.15} trees={0} />
      <Landmarks />
      <Pinisi radius={0.8} speed={0.35} center={[2.4, -3.6]} />
      {/* Logo pita dibaringkan rata (tidak menutupi dadu dari sudut kamera mana pun) */}
      <mesh position={[0, 0.1, 0.9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 2.2]} />
        <meshBasicMaterial map={logo} transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ---------- Landmark Nusantara ----------
const ON = 0.17; // tinggi permukaan pulau

function RoundTree({ p, s = 1 }: { p: [number, number]; s?: number }) {
  return (
    <group position={[p[0], ON, p[1]]} scale={s}>
      <mesh position={[0, 0.1, 0]} material={toon('#7A4A2A')} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.2, 6]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={toon('#3E9A4A')} castShadow>
        <sphereGeometry args={[0.15, 10, 8]} />
      </mesh>
      <mesh position={[0.08, 0.22, 0.05]} material={toon('#57B85A')} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
    </group>
  );
}

/** Monas: pelataran, cawan, tugu, dan lidah api emas. */
function Monas({ p }: { p: [number, number] }) {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flame.current) flame.current.scale.y = 1 + Math.sin(clock.elapsedTime * 6) * 0.08;
  });
  return (
    <group position={[p[0], ON, p[1]]}>
      <mesh position={[0, 0.03, 0]} material={toon('#E9E4D8')} castShadow receiveShadow>
        <boxGeometry args={[0.55, 0.06, 0.55]} />
      </mesh>
      <mesh position={[0, 0.16, 0]} material={toon('#F4F1EA')} castShadow>
        <cylinderGeometry args={[0.24, 0.12, 0.2, 4]} />
      </mesh>
      <mesh position={[0, 0.8, 0]} rotation={[0, Math.PI / 4, 0]} material={toon('#FFFFFF')} castShadow>
        <cylinderGeometry args={[0.045, 0.085, 1.1, 4]} />
      </mesh>
      <mesh position={[0, 1.37, 0]} material={toon('#D8D2C4')}>
        <cylinderGeometry args={[0.07, 0.05, 0.05, 8]} />
      </mesh>
      <mesh ref={flame} position={[0, 1.5, 0]} material={toon('#F2C230', { emissive: '#8A5A00' })} castShadow>
        <coneGeometry args={[0.065, 0.22, 8]} />
      </mesh>
    </group>
  );
}

/** Bendera Merah Putih berkibar. */
function Flag({ p }: { p: [number, number] }) {
  const cloth = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (cloth.current) cloth.current.rotation.y = Math.sin(clock.elapsedTime * 2.2) * 0.25;
  });
  return (
    <group position={[p[0], ON, p[1]]}>
      <mesh position={[0, 0.55, 0]} material={toon('#EEEEEE')} castShadow>
        <cylinderGeometry args={[0.012, 0.016, 1.1, 6]} />
      </mesh>
      <group ref={cloth} position={[0, 1.0, 0]}>
        <mesh position={[0.19, 0.04, 0]} material={toon('#D62C2C')} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.008]} />
        </mesh>
        <mesh position={[0.19, -0.04, 0]} material={toon('#FFFFFF')} castShadow>
          <boxGeometry args={[0.36, 0.08, 0.008]} />
        </mesh>
      </group>
    </group>
  );
}

/** Pura Meru (Bali): atap bertumpuk ganjil. */
function Meru({ p }: { p: [number, number] }) {
  return (
    <group position={[p[0], ON, p[1]]}>
      <mesh position={[0, 0.06, 0]} material={toon('#B8532E')} castShadow>
        <boxGeometry args={[0.36, 0.12, 0.36]} />
      </mesh>
      <mesh position={[0, 0.45, 0]} material={toon('#6B4226')}>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
      </mesh>
      {[0, 1, 2, 3, 4].map((k) => {
        const w = 0.42 - k * 0.07;
        return (
          <mesh key={k} position={[0, 0.2 + k * 0.13, 0]} rotation={[0, Math.PI / 4, 0]} material={toon('#3A2A20')} castShadow>
            <coneGeometry args={[w * 0.75, 0.09, 4]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Komodo low-poly. */
function Komodo({ p, rot = 0 }: { p: [number, number]; rot?: number }) {
  const c = '#6E7B4A';
  return (
    <group position={[p[0], ON + 0.05, p[1]]} rotation={[0, rot, 0]} scale={1.1}>
      <mesh rotation={[0, 0, Math.PI / 2]} material={toon(c)} castShadow>
        <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
      </mesh>
      <mesh position={[0.15, 0.01, 0]} rotation={[0, 0, Math.PI / 2]} material={toon(c)} castShadow>
        <capsuleGeometry args={[0.03, 0.06, 4, 8]} />
      </mesh>
      <mesh position={[-0.2, -0.01, 0]} rotation={[0, 0, Math.PI / 2 + 0.15]} material={toon(c)} castShadow>
        <coneGeometry args={[0.035, 0.22, 6]} />
      </mesh>
      {[-0.07, 0.07].flatMap((x) =>
        [-1, 1].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.04, z * 0.05]} rotation={[z * 0.6, 0, 0]} material={toon(c)}>
            <cylinderGeometry args={[0.014, 0.012, 0.06, 5]} />
          </mesh>
        )),
      )}
      <mesh position={[0.21, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={toon('#D9433A')}>
        <coneGeometry args={[0.008, 0.05, 4]} />
      </mesh>
    </group>
  );
}

function Landmarks() {
  return (
    <group>
      {/* Sumatra: Rumah Gadang */}
      <group position={[-3.05, ON, -2.0]} rotation={[0, -0.5, 0]} scale={0.75}>
        <RegionalHouse group="langit" />
      </group>
      <Palm p={[-3.8, ON, -1.55]} s={0.6} />
      {/* Jawa: Monas + bendera */}
      <Monas p={[-1.2, -0.95]} />
      <Flag p={[-0.45, -0.98]} />
      <RoundTree p={[-2.0, -0.92]} s={0.8} />
      {/* Kalimantan: hutan */}
      {[
        [-1.0, -3.1],
        [-0.55, -2.75],
        [-0.3, -3.25],
        [-1.15, -2.65],
        [-0.75, -3.5],
      ].map(([x, z], k) => (
        <RoundTree key={k} p={[x, z]} s={0.75 + (k % 2) * 0.2} />
      ))}
      {/* Sulawesi: Tongkonan */}
      <group position={[1.25, ON, -2.25]} rotation={[0, 0.3, 0]} scale={0.6}>
        <RegionalHouse group="pandan" />
      </group>
      {/* Bali & Nusa Tenggara: Pura Meru + komodo */}
      <Meru p={[0.65, -0.8]} />
      <Komodo p={[1.6, -0.78]} rot={2.8} />
      {/* Papua: Honai + hutan */}
      <group position={[3.15, ON, -1.85]} scale={0.6}>
        <RegionalHouse group="nila" />
      </group>
      <RoundTree p={[3.75, -2.1]} s={0.8} />
      <Palm p={[3.6, ON, -1.5]} s={0.55} />
    </group>
  );
}

// ---------- Meja & properti di atas meja ----------
const TABLE_Y = -0.55;

export function Table() {
  const tex = useMemo(() => woodTexture(), []);
  return (
    <mesh position={[0, TABLE_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[70, 70]} />
      <meshToonMaterial map={tex} gradientMap={toon('#fff').gradientMap} />
    </mesh>
  );
}

function DeckBox({ p, deck, rot }: { p: [number, number]; deck: 'nasib' | 'warga'; rot: number }) {
  const map = useMemo(() => cardBackTexture(deck), [deck]);
  const side = deck === 'nasib' ? '#B5442C' : '#1F5F8B';
  return (
    <group position={[p[0], TABLE_Y, p[1]]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.22, 0]} material={toon(side)} castShadow receiveShadow>
        <boxGeometry args={[1.25, 0.44, 1.75]} />
      </mesh>
      <mesh position={[0, 0.441, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 1.7]} />
        <meshToonMaterial map={map} gradientMap={toon('#fff').gradientMap} />
      </mesh>
    </group>
  );
}

const BILLS: [string, string][] = [
  ['Rp 500 jt', '#E9A3B8'],
  ['Rp 100 jt', '#F2D36B'],
  ['Rp 50 jt', '#B9A3E3'],
  ['Rp 20 jt', '#9BD48A'],
  ['Rp 10 jt', '#8EC5E8'],
];

function MoneyStack({ p, label, color, n, rot }: { p: [number, number]; label: string; color: string; n: number; rot: number }) {
  const map = useMemo(() => billTexture(label, color), [label, color]);
  return (
    <group position={[p[0], TABLE_Y, p[1]]} rotation={[0, rot, 0]}>
      <mesh position={[0, (n * 0.012) / 2, 0]} material={toon(color)} castShadow receiveShadow>
        <boxGeometry args={[1.5, n * 0.012, 0.75]} />
      </mesh>
      <mesh position={[0, n * 0.012 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 0.75]} />
        <meshToonMaterial map={map} gradientMap={toon('#fff').gradientMap} />
      </mesh>
    </group>
  );
}

function GameBox({ p, rot }: { p: [number, number]; rot: number }) {
  const logo = useMemo(() => logoTexture(), []);
  return (
    <group position={[p[0], TABLE_Y, p[1]]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.3, 0]} material={toon('#2E8BA8')} castShadow receiveShadow>
        <boxGeometry args={[4.2, 0.6, 2.4]} />
      </mesh>
      <mesh position={[0, 0.602, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.0, 2.2]} />
        <meshBasicMaterial color="#7FD0E6" />
      </mesh>
      <mesh position={[0, 0.605, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.8, 1.56]} />
        <meshBasicMaterial map={logo} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Barang di atas meja di sekitar papan (dekorasi). */
export function TableProps() {
  return (
    <group>
      <DeckBox p={[8.3, -4.6]} deck="nasib" rot={0.12} />
      <DeckBox p={[10.0, -4.4]} deck="warga" rot={-0.08} />
      {BILLS.map(([label, color], k) => (
        <MoneyStack key={label} p={[8.4 + (k % 2) * 0.35, 1.0 + k * 0.95]} label={label} color={color} n={8 + ((k * 5) % 7)} rot={-0.1 + k * 0.05} />
      ))}
      <GameBox p={[-10.0, -5.2]} rot={0.18} />
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
