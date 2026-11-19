// Dadu 3D: dilempar, berputar, memantul, lalu berhenti dengan angka hasil di atas.
// Angka sudah ditentukan sebelum animasi (pengacak kriptografis / dadu fisik);
// animasi hanya "mendaratkan" dadu ke orientasi yang sesuai.

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { dieFaceTexture } from './textures.ts';
import { toonGradient } from './materials.ts';

export interface DiceRoll {
  id: number;
  values: number[];
}

// Urutan material BoxGeometry: +X, -X, +Y, -Y, +Z, -Z. Sisi berlawanan berjumlah 7.
const FACE_VALUES = [2, 5, 1, 6, 3, 4];
const NORMALS: Record<number, THREE.Vector3> = {
  2: new THREE.Vector3(1, 0, 0),
  5: new THREE.Vector3(-1, 0, 0),
  1: new THREE.Vector3(0, 1, 0),
  6: new THREE.Vector3(0, -1, 0),
  3: new THREE.Vector3(0, 0, 1),
  4: new THREE.Vector3(0, 0, -1),
};
const UP = new THREE.Vector3(0, 1, 0);

function restingQuat(value: number, yaw: number) {
  const align = new THREE.Quaternion().setFromUnitVectors(NORMALS[value], UP);
  const spin = new THREE.Quaternion().setFromAxisAngle(UP, yaw);
  return spin.multiply(align);
}

const SIZE = 0.52;
const HULL = new THREE.MeshBasicMaterial({ color: '#2B1A10', side: THREE.BackSide });
const REST_Y = 0.16 + SIZE / 2;
const DURATION = 1.25;

function Die({ value, rollId, index, onLanded }: { value: number; rollId: number; index: number; onLanded: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  const mats = useMemo(
    () => FACE_VALUES.map((v) => new THREE.MeshToonMaterial({ map: dieFaceTexture(v), gradientMap: toonGradient() })),
    [],
  );
  const anim = useRef({
    t: 1,
    start: new THREE.Vector3(),
    end: new THREE.Vector3(index ? 0.45 : -0.45, REST_Y, 2.45),
    axis: new THREE.Vector3(1, 0, 0),
    speed: 0,
    q: restingQuat(value, index ? 0.4 : -0.3),
    qEnd: restingQuat(value, index ? 0.4 : -0.3),
    done: true,
  });

  useEffect(() => {
    if (!rollId) return;
    const a = anim.current;
    const side = index ? 1 : -1;
    // Dilempar dari depan-atas, mendarat di area kosong terdepan (paling dekat kamera)
    a.start.set(side * 2.0, 2.8, 4.6);
    a.end.set(side * 0.45 + (Math.random() - 0.5) * 0.2, REST_Y, 2.45 + (Math.random() - 0.5) * 0.2);
    a.axis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    a.speed = 14 + Math.random() * 6;
    a.qEnd = restingQuat(value, (Math.random() - 0.5) * 1.2);
    a.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6));
    a.t = 0;
    a.done = false;
  }, [rollId]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.1); // cegah lompatan saat frame tersendat
    const a = anim.current;
    const m = ref.current;
    if (!m) return;
    if (a.t < 1) {
      a.t = Math.min(1, a.t + dt / DURATION);
      const t = a.t;
      // Posisi: maju ke titik akhir, tinggi dengan pantulan yang meredam
      const ease = 1 - (1 - t) ** 3;
      m.position.lerpVectors(a.start, a.end, ease);
      const bounce = Math.abs(Math.cos(t * Math.PI * 2.5)) * (1 - t) ** 1.6 * 1.6;
      m.position.y = REST_Y + bounce + (1 - ease) * 0.6;
      // Rotasi: berputar cepat, lalu berpindah mulus ke orientasi hasil
      const spin = new THREE.Quaternion().setFromAxisAngle(a.axis, a.speed * dt * (1 - t));
      a.q.premultiply(spin);
      const settle = THREE.MathUtils.smoothstep(t, 0.55, 1);
      m.quaternion.copy(a.q).slerp(a.qEnd, settle);
    } else {
      m.position.copy(a.end);
      m.quaternion.copy(a.qEnd);
      if (!a.done) {
        a.done = true;
        onLanded();
      }
    }
  });

  return (
    <mesh ref={ref} material={mats} castShadow position={anim.current.end} quaternion={anim.current.qEnd}>
      <boxGeometry args={[SIZE, SIZE, SIZE]} />
      <mesh material={HULL} scale={1.07}>
        <boxGeometry args={[SIZE, SIZE, SIZE]} />
      </mesh>
    </mesh>
  );
}

export default function Dice3D({ roll, resting, onDone }: { roll: DiceRoll | null; resting: [number, number] | null; onDone: (r: DiceRoll) => void }) {
  const landed = useRef(0);
  const current = roll ?? (resting ? { id: 0, values: resting } : null);
  useEffect(() => {
    landed.current = 0;
  }, [roll?.id]);
  if (!current) return null;
  const onLanded = () => {
    landed.current += 1;
    if (roll && landed.current === roll.values.length) onDone(roll);
  };
  return (
    <group>
      {current.values.map((v, i) => (
        <Die key={i} index={i} value={v} rollId={current.id} onLanded={onLanded} />
      ))}
    </group>
  );
}
