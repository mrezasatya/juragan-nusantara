// Pion figurin chibi 3D di atas alas bundar berwarna pemain.
// 8 karakter dengan kostum, rambut/penutup kepala, pose khas, dan properti di tangan.
// Animasi: berjalan petak demi petak (kaki & lengan berayun), melompat, mendarat kenyal,
// bersorak, lesu. Lengan yang memegang barang (piring, mangkuk, kopi, HP) tetap stabil saat berjalan.

import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tokenInfo, normalizeToken, type CharacterId } from '../ui/constants.ts';
import { toon } from './materials.ts';
import { TILE_TOP } from './layout3d.ts';
import { batikTexture, kebayaTexture, kosSignTexture, sarungTexture } from './textures.ts';

export interface Emote {
  kind: 'celebrate' | 'sad';
  id: number;
}

interface Props {
  emote?: Emote | null;
  token: string;
  color: string;
  target: [number, number]; // x, z tujuan
  stepMs: number;
  active: boolean;
  jailed: boolean;
  registry?: Map<string, THREE.Object3D>;
  id: string;
}

type V3 = [number, number, number];

// ---------- Ukuran tubuh (satuan lokal, sebelum diskalakan) ----------
const S = 1.6; // skala figurin
const BASE_H = 0.045;
const HIP_Y = 0.16;
const SHOULDER_Y = 0.31;
const SHOULDER_X = 0.088;
const ARM_LEN = 0.115;
const HEAD_Y = 0.455;
const HEAD_R = 0.095;

// ---------- Material ----------
const HULL_MAT = new THREE.MeshBasicMaterial({ color: '#2B1A10', side: THREE.BackSide });
const texMat = (() => {
  const cache = new Map<string, THREE.MeshToonMaterial>();
  return (key: 'batik' | 'kebaya' | 'sarung' | 'kos') => {
    let m = cache.get(key);
    if (!m) {
      const map = key === 'batik' ? batikTexture() : key === 'kebaya' ? kebayaTexture() : key === 'sarung' ? sarungTexture() : kosSignTexture();
      m = new THREE.MeshToonMaterial({ map, gradientMap: toon('#fff').gradientMap });
      cache.set(key, m);
    }
    return m;
  };
})();

function Hull({ r, h = 0, children }: { r: number; h?: number; children: ReactNode }) {
  const t = 0.006;
  const sx = 1 + t / r;
  const sy = 1 + t / (r + h / 2);
  return (
    <mesh material={HULL_MAT} scale={[sx, sy, sx]}>
      {children}
    </mesh>
  );
}

// Primitif kecil
function M({ p, r, s, c, mat, children, cast = true }: { p?: V3; r?: V3; s?: V3 | number; c?: string; mat?: THREE.Material; children: ReactNode; cast?: boolean }) {
  return (
    <mesh position={p} rotation={r} scale={s} material={mat ?? toon(c ?? '#ff00ff')} castShadow={cast}>
      {children}
    </mesh>
  );
}
const Box = (props: { p?: V3; r?: V3; s: V3; c?: string; mat?: THREE.Material }) => (
  <M p={props.p} r={props.r} c={props.c} mat={props.mat}>
    <boxGeometry args={props.s} />
  </M>
);
const Ball = (props: { p?: V3; r: number; c?: string; s?: V3; mat?: THREE.Material }) => (
  <M p={props.p} c={props.c} s={props.s} mat={props.mat} cast={false}>
    <sphereGeometry args={[props.r, 12, 10]} />
  </M>
);
const Cyl = (props: { p?: V3; r?: V3; rt: number; rb: number; h: number; c?: string; seg?: number; mat?: THREE.Material }) => (
  <M p={props.p} r={props.r} c={props.c} mat={props.mat}>
    <cylinderGeometry args={[props.rt, props.rb, props.h, props.seg ?? 14]} />
  </M>
);

// ---------- Definisi karakter ----------
interface Look {
  top: string; // warna baju
  topMat?: 'kebaya';
  sleeve: 'long' | 'short';
  sleeveColor?: string;
  bottom: 'pants' | 'shorts' | 'sarung' | 'jarik';
  pants: string;
  shoes: string;
  socks?: boolean;
  belly?: number;
  hair: 'short' | 'neat' | 'bun' | 'curly' | 'mohawk' | 'none';
  hairColor: string;
  /** Arah lengan saat diam, di ruang tubuh (x+ = kanan figur dilihat dari depan? lihat catatan). */
  poseL: V3;
  poseR: V3;
  holdL?: boolean; // lengan tetap pada pose saat berjalan (memegang barang)
  holdR?: boolean;
  happyEyes?: boolean;
  brows?: 'normal' | 'mischief';
}
// Catatan sumbu: figur menghadap +Z. Lengan "L" berada di x negatif, "R" di x positif.

const LOOKS: Record<CharacterId, Look> = {
  ojol: { top: '#2FA84F', sleeve: 'long', bottom: 'pants', pants: '#2E2E2E', shoes: '#1E1E1E', hair: 'none', hairColor: '#1E1410', poseL: [-0.35, -0.55, 0.75], poseR: [0.2, 0.15, 0.95], holdR: true },
  kos: { top: '#F2EFE8', sleeve: 'short', bottom: 'sarung', pants: '#6A4C93', shoes: '#6B4226', belly: 1.14, hair: 'short', hairColor: '#1E1410', poseL: [0.68, -0.3, 0.68], poseR: [-0.68, -0.22, 0.7], holdL: true, holdR: true },
  warung: { top: '#7B4FA0', topMat: 'kebaya', sleeve: 'long', bottom: 'jarik', pants: '#7A4A22', shoes: '#8A5A35', hair: 'bun', hairColor: '#3A3A3A', poseL: [-0.32, -0.95, 0.05], poseR: [0.12, -0.3, 0.95], holdR: true },
  kantoran: { top: '#FAFAFA', sleeve: 'long', bottom: 'pants', pants: '#1F1F24', shoes: '#151515', hair: 'neat', hairColor: '#1E1410', poseL: [-0.12, -1, 0.02], poseR: [-0.05, -0.35, 0.94], holdR: true },
  pns: { top: '#B9A16B', sleeve: 'short', sleeveColor: '#B9A16B', bottom: 'pants', pants: '#B09763', shoes: '#151515', hair: 'short', hairColor: '#1E1410', poseL: [-0.1, -1, 0.05], poseR: [0.6, -0.78, -0.15] },
  sd: { top: '#FAFAFA', sleeve: 'short', bottom: 'shorts', pants: '#C0392B', shoes: '#151515', socks: true, hair: 'short', hairColor: '#151010', poseL: [-0.15, -1, 0.02], poseR: [0.25, 0.97, 0.05], holdR: true },
  punk: { top: '#2A2A2A', sleeve: 'short', bottom: 'pants', pants: '#3A3F4A', shoes: '#111111', hair: 'mohawk', hairColor: '#1A1A1A', poseL: [-0.1, -1, 0.06], poseR: [0.5, 0.55, 0.65], holdR: true, brows: 'mischief' },
  mie: { top: '#6E8B3D', sleeve: 'short', bottom: 'pants', pants: '#3E5F8A', shoes: '#2A2A2A', hair: 'curly', hairColor: '#1E1410', poseL: [0.55, -0.32, 0.77], poseR: [-0.3, 0.25, 0.92], holdL: true, holdR: true, happyEyes: true },
};

const shoulder = (side: -1 | 1): THREE.Vector3 => new THREE.Vector3(side * SHOULDER_X, SHOULDER_Y, 0);
const handAt = (side: -1 | 1, dir: V3): V3 => {
  const d = new THREE.Vector3(...dir).normalize().multiplyScalar(ARM_LEN);
  const p = shoulder(side).add(d);
  return [p.x, p.y, p.z];
};

// ---------- Kepala ----------
function Face({ look, char }: { look: Look; char: CharacterId }) {
  const eyeY = 0.008;
  const eyeX = 0.036;
  return (
    <group>
      {look.happyEyes ? (
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * eyeX, eyeY, 0.088]} rotation={[0, 0, 0]} material={toon('#1A1A1A')}>
            <torusGeometry args={[0.014, 0.004, 4, 10, Math.PI]} />
          </mesh>
        ))
      ) : (
        [-1, 1].map((s) => (
          <group key={s} position={[s * eyeX, eyeY, 0.084]}>
            <Ball r={0.017} c="#1A1A1A" s={[1, 1.15, 0.6]} />
            <Ball p={[0.005, 0.006, 0.008]} r={0.005} c="#FFFFFF" />
          </group>
        ))
      )}
      {/* alis */}
      {[-1, 1].map((s) => (
        <Box key={s} p={[s * eyeX, 0.042, 0.086]} r={[0, 0, look.brows === 'mischief' ? s * 0.35 : -s * 0.08]} s={[0.026, 0.006, 0.006]} c={look.hairColor === '#3A3A3A' ? '#3A3A3A' : '#2A1A10'} />
      ))}
      {/* hidung & mulut senyum */}
      <Ball p={[0, -0.012, 0.094]} r={0.009} c="#C9845A" />
      <mesh position={[0, -0.038, 0.086]} rotation={[0, 0, Math.PI]} material={toon('#7A2E1D')}>
        <torusGeometry args={[0.02, 0.005, 4, 10, Math.PI]} />
      </mesh>
      {char === 'kos' && (
        <group position={[0, -0.025, 0.093]}>
          <Box p={[-0.014, 0, 0]} r={[0, 0, 0.25]} s={[0.026, 0.008, 0.008]} c="#1E1410" />
          <Box p={[0.014, 0, 0]} r={[0, 0, -0.25]} s={[0.026, 0.008, 0.008]} c="#1E1410" />
        </group>
      )}
      {char === 'kantoran' &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * eyeX, eyeY, 0.094]} material={toon('#1A1A1A')}>
            <torusGeometry args={[0.022, 0.004, 6, 16]} />
          </mesh>
        ))}
      {char === 'kantoran' && <Box p={[0, eyeY + 0.004, 0.095]} s={[0.026, 0.004, 0.004]} c="#1A1A1A" />}
      {/* pipi merona */}
      {[-1, 1].map((s) => (
        <Ball key={s} p={[s * 0.056, -0.02, 0.075]} r={0.012} c="#F09A8A" s={[1, 0.7, 0.4]} />
      ))}
      {char === 'punk' && (
        <mesh position={[-0.096, -0.02, 0]} rotation={[0, Math.PI / 2, 0]} material={toon('#D9D9D9')}>
          <torusGeometry args={[0.009, 0.003, 4, 10]} />
        </mesh>
      )}
    </group>
  );
}

function Hair({ look, char }: { look: Look; char: CharacterId }) {
  const hc = look.hairColor;
  const cap = (t = Math.PI / 2.3, y = 0.012, z = -0.006) => (
    <mesh position={[0, y, z]} material={toon(hc)} castShadow>
      <sphereGeometry args={[HEAD_R * 1.04, 16, 10, 0, Math.PI * 2, 0, t]} />
    </mesh>
  );
  switch (look.hair) {
    case 'short':
      return (
        <group>
          {cap()}
          {char === 'sd' && [-0.03, 0, 0.03].map((x) => <Box key={x} p={[x, 0.07, 0.07]} r={[0.6, 0, 0]} s={[0.03, 0.018, 0.02]} c={hc} />)}
        </group>
      );
    case 'neat':
      return (
        <group>
          {cap(Math.PI / 2.1)}
          <Box p={[0.025, 0.088, 0.04]} r={[0.3, 0, -0.2]} s={[0.07, 0.03, 0.06]} c={hc} />
        </group>
      );
    case 'bun':
      return (
        <group>
          {cap(Math.PI / 2.1)}
          <Ball p={[0, 0.09, -0.05]} r={0.045} c={hc} />
          <Box p={[0, 0.075, -0.03]} s={[0.08, 0.008, 0.01]} c="#C9A227" />
        </group>
      );
    case 'curly':
      return (
        <group>
          {cap(Math.PI / 2.4, 0.02)}
          {Array.from({ length: 11 }, (_, k) => {
            const a = (k / 11) * Math.PI * 2;
            return <Ball key={k} p={[Math.cos(a) * 0.07, 0.07 + (k % 3) * 0.008, Math.sin(a) * 0.06 - 0.005]} r={0.032} c={hc} />;
          })}
          <Ball p={[0, 0.1, 0]} r={0.045} c={hc} />
        </group>
      );
    case 'mohawk':
      return (
        <group>
          {cap(Math.PI / 2.6, 0.006)}
          {Array.from({ length: 6 }, (_, k) => {
            const a = -0.9 + k * 0.38;
            return (
              <mesh key={k} position={[0, Math.cos(a) * 0.1, Math.sin(a) * 0.1]} rotation={[a, 0, 0]} material={toon(k % 2 ? '#C0392B' : '#1A1A1A')} castShadow>
                <coneGeometry args={[0.022, 0.09, 6]} />
              </mesh>
            );
          })}
        </group>
      );
    case 'none':
      return null;
  }
}

function Headwear({ char }: { char: CharacterId }) {
  if (char === 'ojol')
    return (
      <group>
        {/* helm terbuka: menutup atas & belakang kepala, wajah tetap terlihat */}
        <mesh position={[0, 0.03, -0.012]} rotation={[-0.35, 0, 0]} material={toon('#2FA84F')} castShadow>
          <sphereGeometry args={[HEAD_R * 1.14, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2.05]} />
        </mesh>
        <mesh position={[0, 0.03, -0.012]} rotation={[Math.PI / 2 - 0.35, 0, 0]} material={toon('#1E7A37')}>
          <torusGeometry args={[HEAD_R * 1.13, 0.009, 6, 24]} />
        </mesh>
        <Box p={[0, 0.115, 0.075]} r={[-0.25, 0, 0]} s={[0.1, 0.01, 0.045]} c="#1E7A37" />
        {/* tali dagu */}
        {[-1, 1].map((s) => (
          <Box key={s} p={[s * 0.085, -0.045, 0.02]} r={[0, 0, s * 0.15]} s={[0.006, 0.08, 0.006]} c="#1A1A1A" />
        ))}
      </group>
    );
  if (char === 'pns')
    return (
      <mesh position={[0, 0.088, -0.006]} scale={[1, 1, 0.86]} material={toon('#151515')} castShadow>
        <cylinderGeometry args={[0.07, 0.078, 0.06, 18]} />
      </mesh>
    );
  return null;
}

// ---------- Badan & properti ----------
function Torso({ look, char }: { look: Look; char: CharacterId }) {
  const belly = look.belly ?? 1;
  const mat = look.topMat === 'kebaya' ? texMat('kebaya') : toon(look.top);
  return (
    <group>
      <mesh position={[0, 0.245, 0]} scale={[belly, 1, belly]} material={mat} castShadow>
        <capsuleGeometry args={[0.07, 0.09, 4, 12]} />
        <Hull r={0.07} h={0.09}>
          <capsuleGeometry args={[0.07, 0.09, 4, 12]} />
        </Hull>
      </mesh>
      {/* leher */}
      <Cyl p={[0, 0.36, 0]} rt={0.026} rb={0.03} h={0.03} c={tokenInfo(char).skin} />
      {char === 'ojol' && (
        <group>
          <mesh position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#1E7A37')}>
            <torusGeometry args={[0.045, 0.014, 6, 16]} />
          </mesh>
          <Box p={[0, 0.245, 0.071]} s={[0.006, 0.15, 0.004]} c="#1A1A1A" />
          <Box p={[-0.035, 0.29, 0.064]} s={[0.032, 0.01, 0.006]} c="#C0392B" />
          <Box p={[-0.035, 0.28, 0.064]} s={[0.032, 0.01, 0.006]} c="#FFFFFF" />
          <Box p={[0.036, 0.25, 0.062]} s={[0.04, 0.012, 0.006]} c="#1E7A37" />
          <Box p={[0, 0.25, -0.09]} s={[0.12, 0.13, 0.05]} c="#1F1F1F" />
        </group>
      )}
      {char === 'kantoran' && (
        <group>
          <Box p={[0, 0.27, 0.072]} s={[0.018, 0.1, 0.006]} c="#1F3F8B" />
          <Box p={[0, 0.325, 0.07]} s={[0.022, 0.016, 0.01]} c="#1F3F8B" />
          <mesh position={[0, 0.3, 0.02]} rotation={[0.3, 0, 0]} material={toon('#1F5F8B')}>
            <torusGeometry args={[0.05, 0.004, 4, 16, Math.PI]} />
          </mesh>
          <Box p={[0.03, 0.235, 0.075]} s={[0.026, 0.034, 0.004]} c="#FFFFFF" />
          <Box p={[0.03, 0.24, 0.078]} s={[0.018, 0.01, 0.002]} c="#1F5F8B" />
          <mesh position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#FAFAFA')}>
            <torusGeometry args={[0.04, 0.01, 6, 16]} />
          </mesh>
        </group>
      )}
      {char === 'pns' && (
        <group>
          {[-1, 1].map((s) => (
            <Box key={s} p={[s * 0.033, 0.27, 0.068]} s={[0.034, 0.03, 0.008]} c="#9C8653" />
          ))}
          <Box p={[0.034, 0.3, 0.072]} s={[0.03, 0.008, 0.004]} c="#1A1A1A" />
          <Box p={[0, 0.245, 0.071]} s={[0.006, 0.15, 0.004]} c="#9C8653" />
          <mesh position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#9C8653')}>
            <torusGeometry args={[0.042, 0.012, 6, 16]} />
          </mesh>
        </group>
      )}
      {char === 'sd' && (
        <group>
          <Box p={[0.034, 0.28, 0.069]} s={[0.03, 0.03, 0.006]} c="#FFFFFF" />
          <Box p={[0.034, 0.282, 0.073]} s={[0.016, 0.018, 0.003]} c="#C0392B" />
          {[-1, 1].map((s) => (
            <Box key={s} p={[s * 0.045, 0.27, 0.06]} r={[0.15, 0, 0]} s={[0.014, 0.13, 0.008]} c="#7A4A2A" />
          ))}
          <Box p={[0, 0.25, -0.085]} s={[0.11, 0.12, 0.05]} c="#8A4E2A" />
          <mesh position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#FAFAFA')}>
            <torusGeometry args={[0.04, 0.01, 6, 16]} />
          </mesh>
        </group>
      )}
      {char === 'punk' && (
        <group>
          {/* rompi kulit terbuka */}
          {[-1, 1].map((s) => (
            <Box key={s} p={[s * 0.045, 0.255, 0.058]} r={[0, s * 0.35, 0]} s={[0.04, 0.15, 0.02]} c="#111111" />
          ))}
          <Ball p={[0, 0.255, 0.07]} r={0.018} c="#EDEDED" s={[1, 1, 0.5]} />
          {[-1, 1].map((s) => (
            <Ball key={s} p={[s * 0.007, 0.258, 0.078]} r={0.004} c="#111111" />
          ))}
          {[-0.05, 0.05].flatMap((x) => [0.23, 0.27].map((y) => <Ball key={`${x}${y}`} p={[x, y, 0.07]} r={0.005} c="#D9D9D9" />))}
        </group>
      )}
      {char === 'mie' && (
        <group>
          <mesh position={[0, 0.335, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#5A7330')}>
            <torusGeometry args={[0.045, 0.013, 6, 16]} />
          </mesh>
          <Box p={[0, 0.23, 0.015]} r={[0, 0, 0.75]} s={[0.012, 0.21, 0.07]} c="#5A3A22" />
          <Box p={[0.07, 0.15, 0.03]} s={[0.06, 0.06, 0.03]} c="#7A4A2A" />
        </group>
      )}
      {char === 'warung' && <Box p={[0, 0.18, 0]} s={[0.15, 0.018, 0.15]} c="#5A3A22" />}
      {char === 'kos' && <Box p={[0, 0.19, 0.02]} s={[0.15, 0.02, 0.14]} c="#4C3570" />}
    </group>
  );
}

function Lower({ look, skinColor, legL, legR }: { look: Look; skinColor: string; legL: RefObject<THREE.Group | null>; legR: RefObject<THREE.Group | null> }) {
  const skin = toon(skinColor);
  const leg = (side: -1 | 1, ref: RefObject<THREE.Group | null>) => (
    <group ref={ref} position={[side * 0.036, HIP_Y, 0]}>
      <mesh position={[0, -0.07, 0]} material={look.bottom === 'shorts' ? skin : toon(look.pants)} castShadow>
        <capsuleGeometry args={[0.032, 0.08, 4, 8]} />
        <Hull r={0.032} h={0.08}>
          <capsuleGeometry args={[0.032, 0.08, 4, 8]} />
        </Hull>
      </mesh>
      {look.bottom === 'shorts' && (
        <mesh position={[0, -0.02, 0]} material={toon(look.pants)}>
          <cylinderGeometry args={[0.04, 0.042, 0.065, 12]} />
        </mesh>
      )}
      {look.socks && <Cyl p={[0, -0.115, 0]} rt={0.034} rb={0.034} h={0.03} c="#FFFFFF" />}
      {look.pants === '#3A3F4A' && <Ball p={[0, -0.06, 0.028]} r={0.012} c="#C9CED6" s={[1.3, 1, 0.4]} />}
      <Box p={[0, -0.137, 0.018]} s={[0.058, look.shoes === '#111111' ? 0.04 : 0.028, 0.09]} c={look.shoes} />
    </group>
  );
  return (
    <group>
      {leg(-1, legL)}
      {leg(1, legR)}
      {look.bottom === 'sarung' && (
        <mesh position={[0, 0.11, 0]} material={texMat('sarung')} castShadow>
          <cylinderGeometry args={[0.078, 0.092, 0.17, 16]} />
        </mesh>
      )}
      {look.bottom === 'jarik' && (
        <mesh position={[0, 0.1, 0]} material={texMat('batik')} castShadow>
          <cylinderGeometry args={[0.076, 0.088, 0.18, 16]} />
        </mesh>
      )}
    </group>
  );
}

function Arm({ side, look, skinColor, armRef, children }: { side: -1 | 1; look: Look; skinColor: string; armRef: RefObject<THREE.Group | null>; children?: ReactNode }) {
  const sleeve = look.sleeveColor ?? look.top;
  const sleeveMat = look.topMat === 'kebaya' ? texMat('kebaya') : toon(sleeve);
  const skin = toon(skinColor);
  return (
    <group ref={armRef} position={[side * SHOULDER_X, SHOULDER_Y, 0]}>
      <mesh position={[0, -0.06, 0]} material={look.sleeve === 'long' ? sleeveMat : skin} castShadow>
        <capsuleGeometry args={[0.024, 0.075, 4, 8]} />
        <Hull r={0.024} h={0.075}>
          <capsuleGeometry args={[0.024, 0.075, 4, 8]} />
        </Hull>
      </mesh>
      {look.sleeve === 'short' && (
        <mesh position={[0, -0.022, 0]} material={sleeveMat}>
          <cylinderGeometry args={[0.03, 0.032, 0.05, 10]} />
        </mesh>
      )}
      <Ball p={[0, -ARM_LEN, 0]} r={0.027} c={skinColor} />
      {children}
    </group>
  );
}

/** Barang yang menggantung di tangan (ikut berayun bersama lengan). */
function HandProp({ char, side }: { char: CharacterId; side: -1 | 1 }) {
  const at: V3 = [0, -ARM_LEN - 0.02, 0];
  if (char === 'kantoran' && side === -1)
    return (
      <group position={[at[0], at[1] - 0.04, at[2]]}>
        <Box s={[0.1, 0.075, 0.03]} c="#1E1E22" />
        <Box p={[0, 0.045, 0]} s={[0.04, 0.012, 0.012]} c="#1E1E22" />
        <Box p={[0, 0.01, 0.016]} s={[0.012, 0.012, 0.004]} c="#C9A227" />
      </group>
    );
  if (char === 'warung' && side === -1)
    return (
      <group position={[at[0] - 0.02, at[1] - 0.035, at[2]]}>
        <Box s={[0.1, 0.07, 0.075]} c="#C9A26B" />
        <Box p={[0, 0.036, 0]} s={[0.104, 0.008, 0.079]} c="#A9824B" />
        <Box p={[0, 0.045, 0]} r={[0, 0.3, 0.1]} s={[0.08, 0.012, 0.06]} c="#3E8B3A" />
      </group>
    );
  if (char === 'pns' && side === -1) return <Box p={[at[0] - 0.01, at[1] + 0.005, at[2] + 0.01]} r={[0, 0.2, 0]} s={[0.018, 0.085, 0.065]} c="#7A4A2A" />;
  if (char === 'ojol' && side === -1)
    return (
      <group position={[at[0], at[1] + 0.012, at[2] + 0.02]}>
        <mesh position={[0, 0.03, 0]} material={toon('#D9A275')}>
          <capsuleGeometry args={[0.008, 0.025, 3, 6]} />
        </mesh>
      </group>
    );
  if (char === 'punk' && side === -1)
    return (
      <group position={[0, -ARM_LEN + 0.03, 0]}>
        <Cyl rt={0.03} rb={0.03} h={0.02} c="#151515" />
      </group>
    );
  return null;
}

/** Barang yang dipegang stabil (posisi tangan dihitung dari pose, tidak ikut berayun). */
function HeldProps({ char, look }: { char: CharacterId; look: Look }) {
  const hL = handAt(-1, look.poseL);
  const hR = handAt(1, look.poseR);
  switch (char) {
    case 'ojol':
      return <Box p={[hR[0], hR[1] + 0.02, hR[2] + 0.005]} r={[-0.3, 0, 0]} s={[0.035, 0.065, 0.007]} c="#151515" />;
    case 'warung':
      return (
        <group position={[hR[0], hR[1] + 0.022, hR[2]]}>
          <Cyl rt={0.06} rb={0.045} h={0.01} c="#2E8BA8" />
          <Ball p={[-0.012, 0.016, 0]} r={0.024} c="#FFFFFF" s={[1, 0.7, 1]} />
          {[0, 1, 2, 3].map((k) => (
            <Ball key={k} p={[0.025 * Math.cos(k * 1.6), 0.012, 0.025 * Math.sin(k * 1.6)]} r={0.012} c={k % 2 ? '#3E8B3A' : '#E3A21A'} />
          ))}
        </group>
      );
    case 'kantoran':
      return (
        <group position={[hR[0], hR[1] + 0.025, hR[2] + 0.005]}>
          <Cyl rt={0.02} rb={0.016} h={0.05} c="#FFFFFF" />
          <Cyl p={[0, 0.0, 0]} rt={0.0205} rb={0.0185} h={0.02} c="#8A5A35" />
          <Cyl p={[0, 0.028, 0]} rt={0.021} rb={0.021} h={0.008} c="#3B2414" />
        </group>
      );
    case 'punk':
      return (
        <group position={[hR[0], hR[1] + 0.02, hR[2]]}>
          {/* salam metal: telunjuk & kelingking terangkat, renggang */}
          {[-1, 1].map((d) => (
            <mesh key={d} position={[d * 0.02, 0.026, 0]} rotation={[0, 0, -d * 0.25]} material={toon('#DDA679')}>
              <capsuleGeometry args={[0.0065, 0.032, 3, 6]} />
            </mesh>
          ))}
          <Ball p={[0, 0.006, 0.006]} r={0.02} c="#DDA679" s={[1.2, 0.8, 0.9]} />
          <Cyl p={[0, -0.03, 0]} rt={0.03} rb={0.03} h={0.02} c="#151515" />
        </group>
      );
    case 'mie':
      return (
        <group>
          <group position={[hL[0], hL[1] + 0.02, hL[2] + 0.01]}>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]} material={toon('#FFFFFF')} castShadow>
              <sphereGeometry args={[0.052, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#C0392B')}>
              <torusGeometry args={[0.051, 0.004, 4, 18]} />
            </mesh>
            <Ball p={[0.03, -0.005, 0.03]} r={0.011} c="#C0392B" />
            <Ball p={[0, 0.022, 0]} r={0.044} c="#F2C76B" s={[1, 0.3, 1]} />
            <Ball p={[0.015, 0.03, 0.01]} r={0.012} c="#3E8B3A" />
          </group>
          <group position={[hR[0], hR[1] + 0.02, hR[2]]} rotation={[0.9, 0, 0.3]}>
            {[-0.006, 0.006].map((x) => (
              <Cyl key={x} p={[x, 0.05, 0]} rt={0.003} rb={0.004} h={0.12} c="#C08A4A" seg={5} />
            ))}
            <Cyl p={[0, 0.02, 0.0]} rt={0.003} rb={0.003} h={0.07} c="#F2C76B" seg={4} />
          </group>
        </group>
      );
    default:
      return null;
  }
}

/** Properti di alas (tidak dipegang). */
function BaseProps({ char }: { char: CharacterId }) {
  if (char !== 'kos') return null;
  return (
    <group position={[0.14, 0, -0.06]}>
      <Cyl p={[0, 0.27, 0]} rt={0.012} rb={0.014} h={0.54} c="#6B4226" seg={6} />
      <Box p={[0.06, 0.52, 0]} s={[0.13, 0.016, 0.016]} c="#6B4226" />
      {[0.035, 0.105].map((x) => (
        <Box key={x} p={[x, 0.485, 0]} s={[0.003, 0.05, 0.003]} c="#3B2414" />
      ))}
      <mesh position={[0.07, 0.42, 0.006]} material={texMat('kos')} castShadow>
        <boxGeometry args={[0.15, 0.085, 0.012]} />
      </mesh>
    </group>
  );
}

// ---------- Komponen utama ----------
const DOWN = new THREE.Vector3(0, -1, 0);
const tmpQ = new THREE.Quaternion();
const tmpV = new THREE.Vector3();

export default function Pawn({ token, color, target, stepMs, active, jailed, registry, id, emote }: Props) {
  const char = normalizeToken(token);
  const info = tokenInfo(char);
  const look = LOOKS[char];
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const arrow = useRef<THREE.Group>(null);
  const emo = useRef<{ kind: Emote['kind']; t: number } | null>(null);
  const squash = useRef(0);
  const st = useRef({
    pos: new THREE.Vector3(target[0], TILE_TOP, target[1]),
    from: new THREE.Vector3(target[0], TILE_TOP, target[1]),
    to: new THREE.Vector3(target[0], TILE_TOP, target[1]),
    t: 1,
    dur: 0.3,
    jump: false,
    yaw: 0,
    phase: 0,
  });
  const poseL = useMemo(() => new THREE.Vector3(...look.poseL).normalize(), [look]);
  const poseR = useMemo(() => new THREE.Vector3(...look.poseR).normalize(), [look]);
  const baseMat = useMemo(() => new THREE.MeshToonMaterial({ color, gradientMap: toon('#fff').gradientMap }), [color]);
  const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#FFE27A', transparent: true, opacity: 0.9 }), []);
  useEffect(() => () => baseMat.dispose(), [baseMat]);

  useEffect(() => {
    if (emote) emo.current = { kind: emote.kind, t: 0 };
  }, [emote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (root.current && registry) registry.set(id, root.current);
    return () => {
      registry?.delete(id);
    };
  }, [id, registry]);

  useEffect(() => {
    const s = st.current;
    const to = new THREE.Vector3(target[0], TILE_TOP, target[1]);
    if (to.distanceTo(s.to) < 0.001) return;
    s.from.copy(s.pos);
    s.to.copy(to);
    const dist = s.from.distanceTo(to);
    s.jump = dist > 2.2;
    s.dur = s.jump ? 0.75 : Math.max(0.16, (stepMs / 1000) * 0.82);
    s.t = 0;
  }, [target[0], target[1], stepMs]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const s = st.current;
    const time = state.clock.elapsedTime;
    let moving = false;
    if (s.t < 1) {
      moving = true;
      s.t = Math.min(1, s.t + dt / s.dur);
      if (s.t >= 1) squash.current = 1;
      const e = s.t;
      s.pos.lerpVectors(s.from, s.to, s.jump ? e * e * (3 - 2 * e) : e);
      s.pos.y = TILE_TOP + Math.sin(e * Math.PI) * (s.jump ? 1.8 : 0.2);
      const dx = s.to.x - s.from.x;
      const dz = s.to.z - s.from.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.01) {
        let diff = Math.atan2(dx, dz) - s.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        s.yaw += diff * Math.min(1, dt * 14);
      }
      s.phase += dt * (s.jump ? 6 : 16);
    } else {
      let diff = 0 - s.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.yaw += diff * Math.min(1, dt * 2);
    }
    const g = root.current;
    if (!g) return;
    g.position.copy(s.pos);
    g.rotation.y = s.yaw;

    const e = emo.current;
    if (e) {
      e.t += dt;
      if (e.t > 1.9) emo.current = null;
    }
    const cheer = !moving && e?.kind === 'celebrate';
    const sad = !moving && e?.kind === 'sad';
    const swing = moving ? Math.sin(s.phase) * 0.7 : 0;

    // Arah lengan target
    const aim = (side: -1 | 1, pose: THREE.Vector3, hold: boolean | undefined) => {
      if (cheer && !hold) return tmpV.set(side * 0.45, 0.88, 0.15).normalize();
      if (sad && !hold) return tmpV.set(side * 0.05, -1, 0.15).normalize();
      if (moving && !hold) return tmpV.set(side * 0.08, -Math.cos(swing * side), Math.sin(swing * side)).normalize();
      return pose;
    };
    const k = Math.min(1, dt * 12);
    for (const [ref, side, pose, hold] of [
      [armL, -1, poseL, look.holdL],
      [armR, 1, poseR, look.holdR],
    ] as const) {
      const a = ref.current;
      if (!a) continue;
      tmpQ.setFromUnitVectors(DOWN, aim(side, pose, hold).clone());
      a.quaternion.slerp(tmpQ, k);
    }
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (head.current) head.current.rotation.x += ((sad ? 0.45 : 0) - head.current.rotation.x) * k;

    squash.current = Math.max(0, squash.current - dt * 6);
    const sq = Math.sin(squash.current * Math.PI) * 0.16;
    if (body.current) {
      const hop = cheer ? Math.abs(Math.sin(e!.t * 9)) * 0.1 : moving ? Math.abs(Math.sin(s.phase)) * 0.02 : Math.sin(time * 2 + s.from.x) * 0.005;
      body.current.position.y = BASE_H + hop;
      body.current.rotation.x = sad ? 0.1 : 0;
      body.current.scale.set(S * (1 + sq * 0.5), S * (1 - sq), S * (1 + sq * 0.5));
    }
    if (ring.current) {
      ring.current.visible = active;
      const r = 1 + Math.sin(time * 4) * 0.08;
      ring.current.scale.set(r, r, 1);
      ringMat.opacity = 0.6 + Math.sin(time * 4) * 0.3;
    }
    if (arrow.current) {
      arrow.current.visible = active && !moving;
      arrow.current.position.y = 1.15 + Math.sin(time * 3) * 0.06;
      arrow.current.rotation.y = time * 2;
    }
  });

  return (
    <group ref={root}>
      {/* Alas bundar warna pemain */}
      <mesh position={[0, BASE_H / 2, 0]} material={baseMat} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.215, BASE_H, 28]} />
        <mesh material={HULL_MAT} scale={[1.03, 1.15, 1.03]}>
          <cylinderGeometry args={[0.2, 0.215, BASE_H, 28]} />
        </mesh>
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, BASE_H + 0.003, 0]} material={ringMat}>
        <ringGeometry args={[0.15, 0.195, 32]} />
      </mesh>
      <group ref={arrow}>
        <mesh rotation={[Math.PI, 0, 0]} material={toon('#FFD54A', { emissive: '#7A5A00' })}>
          <coneGeometry args={[0.08, 0.15, 4]} />
        </mesh>
      </group>
      <group ref={body} position={[0, BASE_H, 0]} scale={S}>
        <BaseProps char={char} />
        <Lower look={look} skinColor={info.skin} legL={legL} legR={legR} />
        <Torso look={look} char={char} />
        <Arm side={-1} look={look} skinColor={info.skin} armRef={armL}>
          <HandProp char={char} side={-1} />
        </Arm>
        <Arm side={1} look={look} skinColor={info.skin} armRef={armR}>
          <HandProp char={char} side={1} />
        </Arm>
        <HeldProps char={char} look={look} />
        <group ref={head} position={[0, HEAD_Y, 0]}>
          <mesh material={toon(info.skin)} castShadow>
            <sphereGeometry args={[HEAD_R, 20, 16]} />
            <Hull r={HEAD_R}>
              <sphereGeometry args={[HEAD_R, 20, 16]} />
            </Hull>
          </mesh>
          {[-1, 1].map((sd) => (
            <Ball key={sd} p={[sd * 0.094, -0.005, 0]} r={0.02} c={info.skin} />
          ))}
          <Hair look={look} char={char} />
          <Headwear char={char} />
          <Face look={look} char={char} />
        </group>
        {jailed && <Box p={[0, 0.26, 0.085]} s={[0.1, 0.05, 0.006]} c="#F2F2F2" />}
      </group>
    </group>
  );
}
