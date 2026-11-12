// Pion manusia 3D: berjalan (kaki & tangan berayun), melompat kecil di tiap petak,
// melompat tinggi saat dipindah jauh (mis. ke Hotel Prodeo), menghadap arah langkah.

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { tokenInfo, type HatKind } from '../ui/constants.ts';
import { toon } from './materials.ts';
import { TILE_TOP } from './layout3d.ts';

interface Props {
  token: string;
  color: string;
  target: [number, number]; // x, z tujuan
  stepMs: number;
  active: boolean;
  jailed: boolean;
  registry?: Map<string, THREE.Object3D>;
  id: string;
}

function Hat({ kind, color }: { kind: HatKind; color: string }) {
  switch (kind) {
    case 'caping':
      return (
        <mesh position={[0, 0.115, 0]} material={toon('#E2C27A')} castShadow>
          <coneGeometry args={[0.17, 0.09, 14]} />
        </mesh>
      );
    case 'pet':
      return (
        <group position={[0, 0.06, 0]}>
          <mesh material={toon('#3A3A3A')} castShadow>
            <sphereGeometry args={[0.078, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.005, 0.07]} material={toon('#2A2A2A')}>
            <boxGeometry args={[0.1, 0.01, 0.06]} />
          </mesh>
        </group>
      );
    case 'handuk':
      return (
        <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon('#F5F5F5')}>
          <torusGeometry args={[0.065, 0.02, 6, 14]} />
        </mesh>
      );
    case 'pelaut':
      return (
        <group position={[0, 0.06, 0]}>
          <mesh material={toon('#FFFFFF')} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 0.05, 12]} />
          </mesh>
          <mesh position={[0, -0.02, 0]} material={toon('#1F3F8B')}>
            <cylinderGeometry args={[0.1, 0.1, 0.012, 14]} />
          </mesh>
        </group>
      );
    case 'blangkon':
      return (
        <group position={[0, 0.045, 0]}>
          <mesh material={toon('#5B3A1E')} castShadow>
            <sphereGeometry args={[0.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
          <mesh position={[0, 0.0, -0.075]} material={toon('#5B3A1E')}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={toon('#C9A227')}>
            <torusGeometry args={[0.079, 0.006, 4, 16]} />
          </mesh>
        </group>
      );
    case 'bandana':
      return (
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={toon(color)}>
          <torusGeometry args={[0.074, 0.016, 6, 16]} />
        </mesh>
      );
    case 'helm':
      return (
        <group position={[0, 0.01, 0]}>
          <mesh material={toon(color)} castShadow>
            <sphereGeometry args={[0.092, 14, 10, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          </mesh>
          <mesh position={[0, -0.005, 0.06]} rotation={[0.3, 0, 0]} material={toon('#222831', { transparent: true, opacity: 0.85 })}>
            <boxGeometry args={[0.12, 0.05, 0.02]} />
          </mesh>
        </group>
      );
    case 'sanggul':
      return (
        <group>
          <mesh position={[0, 0.03, -0.035]} material={toon('#1E1410')} castShadow>
            <sphereGeometry args={[0.08, 12, 8]} />
          </mesh>
          <mesh position={[0, 0.05, -0.1]} material={toon('#1E1410')}>
            <sphereGeometry args={[0.045, 10, 8]} />
          </mesh>
          <mesh position={[0.05, 0.08, -0.08]} material={toon('#FFD54A')}>
            <sphereGeometry args={[0.02, 6, 6]} />
          </mesh>
          <mesh position={[-0.05, 0.08, -0.08]} material={toon('#FF7FA5')}>
            <sphereGeometry args={[0.02, 6, 6]} />
          </mesh>
        </group>
      );
  }
}

export default function Pawn({ token, color, target, stepMs, active, jailed, registry, id }: Props) {
  const info = tokenInfo(token);
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const arrow = useRef<THREE.Group>(null);
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
      const e = s.t;
      s.pos.lerpVectors(s.from, s.to, s.jump ? e * e * (3 - 2 * e) : e);
      const hop = s.jump ? 1.8 : 0.2;
      s.pos.y = TILE_TOP + Math.sin(e * Math.PI) * hop;
      const dx = s.to.x - s.from.x;
      const dz = s.to.z - s.from.z;
      if (Math.abs(dx) + Math.abs(dz) > 0.01) {
        const want = Math.atan2(dx, dz);
        let diff = want - s.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        s.yaw += diff * Math.min(1, dt * 14);
      }
      s.phase += dt * (s.jump ? 6 : 16);
    } else {
      // Diam: menghadap kamera pelan-pelan
      let diff = 0 - s.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      s.yaw += diff * Math.min(1, dt * 2);
    }
    const g = root.current;
    if (!g) return;
    g.position.copy(s.pos);
    g.rotation.y = s.yaw;
    const swing = moving ? Math.sin(s.phase) * 0.8 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    if (armL.current) armL.current.rotation.x = -swing * 0.9;
    if (armR.current) armR.current.rotation.x = swing * 0.9;
    if (armL.current) armL.current.rotation.z = moving ? 0.1 : active ? 0.15 + Math.sin(time * 3) * 0.05 : 0.1;
    if (armR.current) armR.current.rotation.z = moving ? -0.1 : active ? -(0.15 + Math.sin(time * 3) * 0.05) : -0.1;
    if (body.current) body.current.position.y = moving ? Math.abs(Math.sin(s.phase)) * 0.025 : Math.sin(time * 2 + s.from.x) * 0.006;
    if (ring.current) {
      ring.current.visible = active;
      const k = 1 + Math.sin(time * 4) * 0.12;
      ring.current.scale.set(k, k, 1);
    }
    if (arrow.current) {
      arrow.current.visible = active && !moving;
      arrow.current.position.y = 1.02 + Math.sin(time * 3) * 0.06;
      arrow.current.rotation.y = time * 2;
    }
  });

  const shirt = toon(color);
  const skin = toon(info.skin);
  const pants = toon(info.pants);
  return (
    <group ref={root}>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={toon(color, { emissive: color })}>
        <ringGeometry args={[0.2, 0.26, 24]} />
      </mesh>
      <group ref={arrow}>
        <mesh rotation={[Math.PI, 0, 0]} material={toon('#FFD54A', { emissive: '#7A5A00' })}>
          <coneGeometry args={[0.07, 0.13, 4]} />
        </mesh>
      </group>
      <group ref={body} scale={1.75}>
        {/* kaki */}
        <group ref={legL} position={[-0.035, 0.15, 0]}>
          <mesh position={[0, -0.07, 0]} material={pants} castShadow>
            <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.135, 0.015]} material={toon('#2B1A10')}>
            <boxGeometry args={[0.05, 0.025, 0.08]} />
          </mesh>
        </group>
        <group ref={legR} position={[0.035, 0.15, 0]}>
          <mesh position={[0, -0.07, 0]} material={pants} castShadow>
            <capsuleGeometry args={[0.03, 0.08, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.135, 0.015]} material={toon('#2B1A10')}>
            <boxGeometry args={[0.05, 0.025, 0.08]} />
          </mesh>
        </group>
        {/* badan (kemeja warna pemain) */}
        <mesh position={[0, 0.24, 0]} material={shirt} castShadow>
          <capsuleGeometry args={[0.065, 0.1, 4, 10]} />
        </mesh>
        {/* motif kain: sabuk */}
        <mesh position={[0, 0.17, 0]} material={toon('#F2C230')}>
          <cylinderGeometry args={[0.068, 0.068, 0.02, 12]} />
        </mesh>
        {/* lengan */}
        <group ref={armL} position={[-0.085, 0.3, 0]}>
          <mesh position={[0, -0.06, 0]} material={shirt} castShadow>
            <capsuleGeometry args={[0.022, 0.07, 4, 6]} />
          </mesh>
          <mesh position={[0, -0.115, 0]} material={skin}>
            <sphereGeometry args={[0.022, 8, 6]} />
          </mesh>
        </group>
        <group ref={armR} position={[0.085, 0.3, 0]}>
          <mesh position={[0, -0.06, 0]} material={shirt} castShadow>
            <capsuleGeometry args={[0.022, 0.07, 4, 6]} />
          </mesh>
          <mesh position={[0, -0.115, 0]} material={skin}>
            <sphereGeometry args={[0.022, 8, 6]} />
          </mesh>
        </group>
        {/* kepala */}
        <group position={[0, 0.405, 0]}>
          <mesh material={skin} castShadow>
            <sphereGeometry args={[0.075, 16, 12]} />
          </mesh>
          <mesh position={[-0.026, 0.01, 0.066]} material={toon('#1A1A1A')}>
            <sphereGeometry args={[0.011, 6, 6]} />
          </mesh>
          <mesh position={[0.026, 0.01, 0.066]} material={toon('#1A1A1A')}>
            <sphereGeometry args={[0.011, 6, 6]} />
          </mesh>
          <mesh position={[0, -0.025, 0.068]} rotation={[0, 0, Math.PI]} material={toon('#7A2E1D')}>
            <torusGeometry args={[0.018, 0.005, 4, 8, Math.PI]} />
          </mesh>
          {info.hat !== 'helm' && info.hat !== 'sanggul' && (
            <mesh position={[0, 0.03, -0.012]} material={toon('#1E1410')}>
              <sphereGeometry args={[0.074, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.4]} />
            </mesh>
          )}
          <Hat kind={info.hat} color={color} />
        </group>
        {jailed && (
          <mesh position={[0, 0.25, 0.09]} material={toon('#F2F2F2')}>
            <boxGeometry args={[0.1, 0.06, 0.01]} />
          </mesh>
        )}
      </group>
    </group>
  );
}
