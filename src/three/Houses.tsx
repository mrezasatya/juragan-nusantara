// Rumah adat 3D low-poly per grup wilayah (Bagian 4.1). Semua dibangun dari geometri prosedural.
// Satuan model: lebar ±1, menghadap +Z. Homestay = skala kecil, Resort = versi besar + kolam & bendera.

import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import type { GroupId } from '../engine/types.ts';
import { PALETTE, toon } from './materials.ts';

type V3 = [number, number, number];

function Box({ s, p, c, r }: { s: V3; p: V3; c: string; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} material={toon(c)} castShadow receiveShadow>
      <boxGeometry args={s} />
    </mesh>
  );
}
function Cyl({ rt, rb, h, p, c, seg = 8, r }: { rt: number; rb: number; h: number; p: V3; c: string; seg?: number; r?: V3 }) {
  return (
    <mesh position={p} rotation={r} material={toon(c)} castShadow>
      <cylinderGeometry args={[rt, rb, h, seg]} />
    </mesh>
  );
}
function Stilts({ w, d, h, c = PALETTE.jatiTua }: { w: number; d: number; h: number; c?: string }) {
  const xs = [-w / 2, w / 2];
  const zs = [-d / 2, d / 2];
  return (
    <>
      {xs.flatMap((x) => zs.map((z) => <Cyl key={`${x}${z}`} rt={0.035} rb={0.035} h={h} p={[x, h / 2, z]} c={c} seg={6} />))}
    </>
  );
}

/**
 * Atap pelana melengkung: penampang segitiga, garis bubungan bisa melengkung naik di ujung
 * (Tongkonan, Bolon, Gadang) atau lurus (Betang, Sunda).
 */
function saddleRoofGeometry(o: {
  length: number;
  depth: number;
  ridge: number;
  ridgeEnd: number;
  eave: number;
  eaveEnd: number;
  curve?: number;
  flare?: number;
  seg?: number;
}) {
  const seg = o.seg ?? 16;
  const p = o.curve ?? 2;
  const pos: number[] = [];
  const pt = (t: number) => {
    const a = Math.abs(t) ** p;
    const x = t * (o.length / 2) * (1 + (o.flare ?? 0) * Math.abs(t) ** 2);
    return { x, h: o.ridge + (o.ridgeEnd - o.ridge) * a, e: o.eave + (o.eaveEnd - o.eave) * a };
  };
  const tri = (a: number[], b: number[], c: number[]) => pos.push(...a, ...b, ...c);
  for (let i = 0; i < seg; i++) {
    const t0 = -1 + (2 * i) / seg;
    const t1 = -1 + (2 * (i + 1)) / seg;
    const A = pt(t0);
    const B = pt(t1);
    const r0 = [A.x, A.h, 0];
    const r1 = [B.x, B.h, 0];
    for (const z of [-o.depth / 2, o.depth / 2]) {
      const e0 = [A.x, A.e, z];
      const e1 = [B.x, B.e, z];
      tri(r0, e0, e1);
      tri(r0, e1, r1);
    }
  }
  // Tutup ujung (segitiga gable)
  for (const t of [-1, 1]) {
    const P = pt(t);
    tri([P.x, P.h, 0], [P.x, P.e, -o.depth / 2], [P.x, P.e, o.depth / 2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function SaddleRoof(props: Parameters<typeof saddleRoofGeometry>[0] & { c: string; p?: V3 }) {
  const { c, p, ...o } = props;
  const geo = useMemo(() => saddleRoofGeometry(o), [o.length, o.depth, o.ridge, o.ridgeEnd, o.eave, o.eaveEnd, o.curve, o.flare]); // eslint-disable-line react-hooks/exhaustive-deps
  const mat = useMemo(() => {
    const m = toon(c).clone();
    m.side = THREE.DoubleSide;
    return m;
  }, [c]);
  return <mesh geometry={geo} material={mat} position={p} castShadow />;
}

/** Papan ukiran segitiga di ujung atap (menghadap +X sebelum diputar). */
function GablePlate({ x, base, top, half, c, inner }: { x: number; base: number; top: number; half: number; c: string; inner?: string[] }) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-half, base);
    sh.lineTo(half, base);
    sh.lineTo(0, top);
    sh.closePath();
    return new THREE.ShapeGeometry(sh);
  }, [base, top, half]);
  return (
    <group position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={geo} material={toon(c)} />
      {inner?.map((col, k) => {
        const f = 0.72 - k * 0.22;
        return (
          <mesh key={k} geometry={geo} material={toon(col)} position={[0, base + (1 - f) * (top - base) * 0.22 - base * f, 0.002 * (k + 1)]} scale={[f, f, 1]} />
        );
      })}
    </group>
  );
}

/** Atap limas/piramida (Joglo, Bali): kerucut 4 sisi diputar 45°. */
function Pyramid({ r, h, p, c }: { r: number; h: number; p: V3; c: string }) {
  return (
    <mesh position={p} rotation={[0, Math.PI / 4, 0]} material={toon(c)} castShadow>
      <coneGeometry args={[r, h, 4]} />
    </mesh>
  );
}

// ---------- 8 gaya rumah ----------

/** Kopi — Rumah Bolon (Batak/Sumatra Utara): panggung, dinding gelap berhias merah-putih, atap pelana melengkung.
 *  Diputar agar ujung atap (gable) menghadap ke depan. */
function Bolon() {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Stilts w={0.7} d={0.45} h={0.22} />
      <Box s={[0.82, 0.24, 0.52]} p={[0, 0.34, 0]} c="#4A2A1A" />
      <Box s={[0.84, 0.05, 0.54]} p={[0, 0.3, 0]} c="#C0392B" />
      <Box s={[0.84, 0.03, 0.54]} p={[0, 0.4, 0]} c="#F4F1E8" />
      <Box s={[0.02, 0.16, 0.14]} p={[0.42, 0.34, 0]} c="#1E120B" />
      <SaddleRoof length={0.98} depth={0.66} ridge={0.8} ridgeEnd={1.04} eave={0.44} eaveEnd={0.54} curve={2} flare={0.12} c="#6E4B33" />
      <GablePlate x={0.5} base={0.5} top={0.98} half={0.27} c="#C0392B" inner={['#F4F1E8', '#1E120B']} />
    </group>
  );
}

/** Langit — Rumah Gadang (Minangkabau): atap bergonjong runcing bertingkat, dinding ukir merah-emas. */
function Gadang() {
  return (
    <group>
      <Stilts w={0.8} d={0.4} h={0.16} />
      <Box s={[0.96, 0.26, 0.5]} p={[0, 0.29, 0]} c="#8E2A1C" />
      <Box s={[0.98, 0.04, 0.52]} p={[0, 0.2, 0]} c={PALETTE.kunyit} />
      {[-0.28, 0, 0.28].map((x) => (
        <Box key={x} s={[0.1, 0.12, 0.02]} p={[x, 0.3, 0.26]} c="#2B1A10" />
      ))}
      <SaddleRoof length={0.62} depth={0.6} ridge={0.7} ridgeEnd={1.12} eave={0.42} eaveEnd={0.5} curve={3} flare={0.25} c="#5E4535" p={[0, 0, 0]} />
      <SaddleRoof length={0.46} depth={0.54} ridge={0.58} ridgeEnd={0.94} eave={0.4} eaveEnd={0.48} curve={3} flare={0.25} c="#5E4535" p={[-0.42, 0, 0]} />
      <SaddleRoof length={0.46} depth={0.54} ridge={0.58} ridgeEnd={0.94} eave={0.4} eaveEnd={0.48} curve={3} flare={0.25} c="#5E4535" p={[0.42, 0, 0]} />
      {[-0.42 - 0.3, -0.42 + 0.3, -0.36, 0.36, 0.42 - 0.3, 0.42 + 0.3].map((x, k) => (
        <mesh key={k} position={[x * 1.02, k === 2 || k === 3 ? 1.13 : 0.95, 0]} material={toon('#E3A21A', { emissive: '#5A3C00' })}>
          <coneGeometry args={[0.025, 0.08, 5]} />
        </mesh>
      ))}
    </group>
  );
}

/** Jambu — rumah Sunda/Betawi: dinding hijau-putih, teras, atap pelana lebar berwarna genteng. */
function Sunda() {
  return (
    <group>
      <Box s={[0.9, 0.06, 0.62]} p={[0, 0.03, 0]} c="#BFA27A" />
      <Box s={[0.74, 0.3, 0.46]} p={[0, 0.21, -0.03]} c="#F7F2E4" />
      <Box s={[0.76, 0.06, 0.48]} p={[0, 0.09, -0.03]} c="#3E8B3A" />
      <Box s={[0.14, 0.2, 0.02]} p={[0, 0.16, 0.21]} c="#3E8B3A" />
      {[-0.24, 0.24].map((x) => (
        <Box key={x} s={[0.12, 0.1, 0.02]} p={[x, 0.24, 0.21]} c="#2E5E7A" />
      ))}
      {[-0.38, 0.38].map((x) => (
        <Cyl key={x} rt={0.02} rb={0.02} h={0.3} p={[x, 0.2, 0.27]} c="#F7F2E4" seg={6} />
      ))}
      <SaddleRoof length={0.98} depth={0.78} ridge={0.62} ridgeEnd={0.62} eave={0.34} eaveEnd={0.34} c={PALETTE.genteng} />
    </group>
  );
}

/** Jeruk — Joglo (Jawa Tengah/Timur/DIY): atap limas bertingkat menjulang, genteng terakota. */
function Joglo() {
  return (
    <group>
      <Box s={[0.86, 0.06, 0.86]} p={[0, 0.03, 0]} c="#9C8468" />
      <Box s={[0.6, 0.28, 0.6]} p={[0, 0.2, 0]} c="#A0672F" />
      <Box s={[0.16, 0.2, 0.02]} p={[0, 0.16, 0.31]} c="#4A2C18" />
      {[-0.4, 0.4].flatMap((x) =>
        [-0.4, 0.4].map((z) => <Cyl key={`${x}${z}`} rt={0.025} rb={0.025} h={0.32} p={[x, 0.2, z]} c="#6B4226" seg={6} />),
      )}
      <Pyramid r={0.7} h={0.24} p={[0, 0.46, 0]} c={PALETTE.genteng} />
      <Pyramid r={0.38} h={0.42} p={[0, 0.72, 0]} c="#B04A22" />
    </group>
  );
}

/** Cabai — Bale Bali/Lombok: alas bata merah, tiang putih, atap ilalang curam. */
function Bali() {
  return (
    <group>
      <Box s={[0.8, 0.14, 0.7]} p={[0, 0.07, 0]} c="#C2562F" />
      <Box s={[0.82, 0.03, 0.72]} p={[0, 0.15, 0]} c="#E9E1D2" />
      {[-0.3, 0.3].flatMap((x) =>
        [-0.24, 0.24].map((z) => <Box key={`${x}${z}`} s={[0.06, 0.26, 0.06]} p={[x, 0.29, z]} c="#F4EEE2" />),
      )}
      <Box s={[0.5, 0.18, 0.4]} p={[0, 0.25, -0.05]} c="#E6C79A" />
      <Pyramid r={0.62} h={0.58} p={[0, 0.68, 0]} c={PALETTE.jerami} />
      <Cyl rt={0.0} rb={0.05} h={0.14} p={[0, 1.0, 0]} c="#B5442C" seg={6} />
    </group>
  );
}

/** Kunyit — Rumah Betang (Dayak/Kalimantan): rumah panjang panggung tinggi, ornamen kuning-hitam. */
function Betang() {
  return (
    <group>
      <Stilts w={0.9} d={0.36} h={0.26} />
      <Cyl rt={0.03} rb={0.03} h={0.26} p={[0, 0.13, 0.18]} c={PALETTE.jatiTua} seg={6} />
      <Box s={[1.02, 0.22, 0.44]} p={[0, 0.37, 0]} c="#7A5233" />
      <Box s={[1.04, 0.04, 0.46]} p={[0, 0.3, 0]} c="#F2C230" />
      <Box s={[1.04, 0.03, 0.46]} p={[0, 0.46, 0]} c="#1E120B" />
      {[-0.3, 0, 0.3].map((x) => (
        <Box key={x} s={[0.08, 0.1, 0.02]} p={[x, 0.38, 0.23]} c="#F2C230" />
      ))}
      <Box s={[0.12, 0.03, 0.3]} p={[0, 0.16, 0.36]} c="#6B4226" r={[0.6, 0, 0]} />
      <SaddleRoof length={1.12} depth={0.62} ridge={0.74} ridgeEnd={0.8} eave={0.48} eaveEnd={0.5} c="#5A3A22" />
    </group>
  );
}

/** Pandan — Tongkonan (Toraja/Sulawesi): atap perahu yang melengkung tajam ke atas, ujungnya menghadap ke depan. */
function Tongkonan() {
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <Stilts w={0.5} d={0.36} h={0.22} />
      <Box s={[0.6, 0.22, 0.44]} p={[0, 0.33, 0]} c="#7A2E1D" />
      <Box s={[0.62, 0.04, 0.46]} p={[0, 0.26, 0]} c="#1E120B" />
      <Box s={[0.62, 0.03, 0.46]} p={[0, 0.4, 0]} c="#F2C230" />
      <SaddleRoof length={0.8} depth={0.6} ridge={0.7} ridgeEnd={1.08} eave={0.46} eaveEnd={0.72} curve={2.2} flare={0.38} c="#4E3A2C" />
      <GablePlate x={0.31} base={0.44} top={0.86} half={0.23} c="#8E2A1C" inner={['#F2C230', '#1E120B']} />
      {/* tanduk kerbau di tiang depan */}
      <group position={[0.34, 0.5, 0]}>
        <Cyl rt={0.03} rb={0.03} h={0.3} p={[0, -0.12, 0]} c="#8E2A1C" seg={6} />
        {[-1, 1].map((d) => (
          <mesh key={d} position={[0.02, 0.05, d * 0.06]} rotation={[d * 0.9, 0, 0]} material={toon('#F4F1E8')}>
            <coneGeometry args={[0.018, 0.12, 5]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Nila — Honai (Papua): dinding bundar, atap kubah ilalang. */
function Honai() {
  return (
    <group>
      <Cyl rt={0.3} rb={0.32} h={0.26} p={[0, 0.13, 0]} c="#7A5233" seg={12} />
      <Box s={[0.12, 0.16, 0.02]} p={[0, 0.1, 0.31]} c="#2B1A10" />
      <mesh position={[0, 0.24, 0]} scale={[1, 0.9, 1]} material={toon(PALETTE.jerami)} castShadow>
        <sphereGeometry args={[0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Cyl rt={0.0} rb={0.05} h={0.08} p={[0, 0.62, 0]} c={PALETTE.ijuk} seg={6} />
    </group>
  );
}

const STYLES: Record<GroupId, () => ReactNode> = {
  kopi: Bolon,
  langit: Gadang,
  jambu: Sunda,
  jeruk: Joglo,
  cabai: Bali,
  kunyit: Betang,
  pandan: Tongkonan,
  nila: Honai,
};

export const HOUSE_NAMES: Record<GroupId, string> = {
  kopi: 'Rumah Bolon',
  langit: 'Rumah Gadang',
  jambu: 'Rumah Sunda/Betawi',
  jeruk: 'Rumah Joglo',
  cabai: 'Bale Bali',
  kunyit: 'Rumah Betang',
  pandan: 'Tongkonan',
  nila: 'Honai',
};

export function RegionalHouse({ group }: { group: GroupId }) {
  const H = STYLES[group];
  return <H />;
}

function Palm({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <group position={p} scale={s}>
      <Cyl rt={0.025} rb={0.04} h={0.6} p={[0.04, 0.3, 0]} c="#8A5A3A" r={[0, 0, -0.15]} seg={6} />
      {[0, 1, 2, 3, 4].map((k) => (
        <mesh key={k} position={[0.09, 0.6, 0]} rotation={[0, (k * Math.PI * 2) / 5, 0.9]} material={toon('#3FA34D')} castShadow>
          <coneGeometry args={[0.06, 0.4, 4]} />
        </mesh>
      ))}
    </group>
  );
}

/** Resort: rumah adat versi besar + kolam renang + pohon kelapa + bendera grup. */
export function Resort({ group, color }: { group: GroupId; color: string }) {
  return (
    <group>
      <group scale={0.9} position={[0, 0, -0.08]}>
        <RegionalHouse group={group} />
      </group>
      <mesh position={[0.32, 0.03, 0.42]} material={toon('#E9E1D2')} receiveShadow>
        <boxGeometry args={[0.42, 0.06, 0.26]} />
      </mesh>
      <mesh position={[0.32, 0.065, 0.42]} material={toon('#35C2E0', { emissive: '#0E5F78' })}>
        <boxGeometry args={[0.36, 0.01, 0.2]} />
      </mesh>
      <Palm p={[-0.42, 0, 0.36]} s={0.8} />
      <group position={[0.5, 0, -0.3]}>
        <Cyl rt={0.012} rb={0.012} h={0.9} p={[0, 0.45, 0]} c="#DDDDDD" seg={5} />
        <Box s={[0.22, 0.13, 0.01]} p={[0.11, 0.82, 0]} c={color} />
      </group>
    </group>
  );
}

/** Bendera kepemilikan di petak (warna pemain). */
export function OwnerFlag({ color }: { color: string }) {
  return (
    <group>
      <Cyl rt={0.012} rb={0.012} h={0.42} p={[0, 0.21, 0]} c="#EEEEEE" seg={5} />
      <mesh position={[0.08, 0.36, 0]} material={toon(color)} castShadow>
        <boxGeometry args={[0.16, 0.1, 0.012]} />
      </mesh>
      <mesh position={[0, 0.005, 0]} material={toon(color)}>
        <cylinderGeometry args={[0.06, 0.06, 0.01, 10]} />
      </mesh>
    </group>
  );
}

export { Palm };
