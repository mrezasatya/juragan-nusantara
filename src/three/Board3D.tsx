// Papan 3D Juragan Nusantara (Three.js lewat React Three Fiber).
// Engine aturan tidak berubah; komponen ini hanya menampilkan state permainan dalam 3D.

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { TILES, isOwnable } from '../engine/data.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import { useAnimatedPositions } from '../ui/useAnimatedPositions.ts';
import { HALF, TILE_RECTS, TILE_TOP, standPoint } from './layout3d.ts';
import { PALETTE, toon } from './materials.ts';
import { makeTileTexture } from './textures.ts';
import { OwnerFlag, RegionalHouse, Resort } from './Houses.tsx';
import Pawn from './Pawn.tsx';
import Dice3D, { type DiceRoll } from './Dice3D.tsx';
import { CenterSea, CornerProps, Ocean, Sky } from './Decor.tsx';

export const STEP_MS_3D = 300;

interface Props {
  game: GameState;
  onTileClick: (i: number) => void;
  onAnimating: (busy: boolean) => void;
  diceRoll: DiceRoll | null;
  onDiceDone: (r: DiceRoll) => void;
  onSwitch2D: () => void;
  rolling: boolean;
}

// ---------- Petak ----------

function Tile({ index, mortgaged, onClick }: { index: number; mortgaged: boolean; onClick: (i: number) => void }) {
  const r = TILE_RECTS[index];
  const tex = useMemo(() => makeTileTexture(index, { mortgaged }), [index, mortgaged]);
  useEffect(() => () => tex.dispose(), [tex]);
  const side = r.side === 'corner' ? '#E8C27A' : '#F1DDB4';
  const mats = useMemo(() => {
    const s = toon(side);
    const top = new THREE.MeshToonMaterial({ map: tex, gradientMap: s.gradientMap });
    return [s, s, top, s, s, s];
  }, [tex, side]);
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 8) return; // seret kamera, bukan klik
    onClick(index);
  };
  return (
    <mesh
      position={[r.x, TILE_TOP - 0.055, r.z]}
      material={mats}
      receiveShadow
      castShadow
      onClick={click}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <boxGeometry args={[r.w - 0.05, 0.11, r.d - 0.05]} />
    </mesh>
  );
}

/** Bangunan & bendera milik di satu petak. Rumah di sisi dalam petak, bendera di sudut luar. */
function TileOwnership({ index, game }: { index: number; game: GameState }) {
  const t = TILES[index];
  const o = isOwnable(t) ? game.board[index] : null;
  if (!o?.owner) return null;
  const owner = game.players.find((p) => p.id === o.owner);
  if (!owner) return null;
  const r = TILE_RECTS[index];
  const [ix, iz] = r.inward;
  const ax = -iz; // sumbu "sejajar tepi papan"
  const az = ix;
  const yaw = Math.atan2(-ix, -iz); // rumah menghadap ke luar papan
  const at = (across: number, inward: number): [number, number, number] => [r.x + ax * across + ix * inward, TILE_TOP, r.z + az * across + iz * inward];
  const flag = <group position={at(0.36, -0.55)}>{<OwnerFlag color={owner.color} />}</group>;
  if (t.kind !== 'property' || o.level === 0) return flag;
  if (o.level === 5)
    return (
      <>
        {flag}
        <group position={at(0, 0.4)} rotation={[0, yaw, 0]} scale={0.7}>
          <Resort group={t.group} color={owner.color} />
        </group>
      </>
    );
  const slots: [number, number][] = [
    [0, 0.42],
    [0.22, 0.4],
    [-0.22, 0.4],
    [0, 0.7],
  ];
  const layout = o.level === 1 ? [slots[0]] : o.level === 2 ? [slots[1], slots[2]] : o.level === 3 ? [slots[1], slots[2], slots[3]] : [slots[1], slots[2], [0.22, 0.7], [-0.22, 0.7]];
  return (
    <>
      {flag}
      {layout.map(([a, n], k) => (
        <group key={k} position={at(a, n)} rotation={[0, yaw, 0]} scale={0.36}>
          <RegionalHouse group={t.group} />
        </group>
      ))}
    </>
  );
}

function BoardBase() {
  const W = HALF * 2;
  return (
    <group>
      <mesh position={[0, -0.25, 0]} material={toon('#8E3B22')} castShadow receiveShadow>
        <boxGeometry args={[W + 0.7, 0.6, W + 0.7]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} material={toon(PALETTE.kunyit)} receiveShadow>
        <boxGeometry args={[W + 0.36, 0.06, W + 0.36]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={toon('#6B4226')} receiveShadow>
        <boxGeometry args={[W + 0.1, 0.02, W + 0.1]} />
      </mesh>
      {/* Kaki penyangga di laut */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * (HALF - 0.4), -0.9, sz * (HALF - 0.4)]} material={toon('#5A3A22')}>
            <cylinderGeometry args={[0.25, 0.3, 1.2, 8]} />
          </mesh>
        )),
      )}
    </group>
  );
}

// ---------- Kamera ----------

function CameraRig({ follow, resetTick }: { follow: () => THREE.Object3D | null; resetTick: number }) {
  const { camera, size, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; size: { width: number; height: number }; controls: OrbitControlsImpl | null };
  const userUntil = useRef(0);
  const target = useRef(new THREE.Vector3(0, 0, 1.2));
  const dir = useMemo(() => new THREE.Vector3(0, Math.sin(THREE.MathUtils.degToRad(44)), Math.cos(THREE.MathUtils.degToRad(44))).normalize(), []);

  const overviewDist = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const byW = 16.2 / 2 / Math.tan(hfov / 2);
    const byH = 9.6 / 2 / Math.tan(vfov / 2) + 1.2;
    return Math.max(byW, byH);
  }, [size.width, size.height, camera.fov]);

  useEffect(() => {
    if (!controls) return;
    const onStart = () => (userUntil.current = performance.now() + 9000);
    controls.addEventListener('start', onStart);
    return () => controls.removeEventListener('start', onStart);
  }, [controls]);
  useEffect(() => {
    userUntil.current = 0;
  }, [resetTick]);

  useFrame((_, dt) => {
    if (!controls || performance.now() < userUntil.current) return;
    const f = follow();
    const wantTarget = new THREE.Vector3(0, 0, 1.2);
    let dist = overviewDist;
    if (f) {
      wantTarget.lerp(new THREE.Vector3(f.position.x, 0, f.position.z), 0.75);
      dist = Math.min(dist * 0.55, 9);
    }
    const k = 1 - Math.exp(-dt * 2.4);
    target.current.lerp(wantTarget, k);
    controls.target.copy(target.current);
    camera.position.lerp(target.current.clone().addScaledVector(dir, dist), k);
    controls.update();
  });
  return null;
}

// ---------- Scene ----------

function Scene({ game, onTileClick, onAnimating, diceRoll, onDiceDone, resetTick }: Omit<Props, 'onSwitch2D' | 'rolling'> & { resetTick: number }) {
  const { pos, mover } = useAnimatedPositions(game, onAnimating, STEP_MS_3D);
  const registry = useMemo(() => new Map<string, THREE.Object3D>(), []);
  const current = game.players[game.current];

  const groups: Record<number, string[]> = {};
  for (const p of game.players) {
    if (p.bankrupt) continue;
    const at = pos[p.id] ?? p.position;
    const key = p.inJail && at === 10 ? 100 : at; // yang ditahan berdiri di dalam sel
    (groups[key] ??= []).push(p.id);
  }

  return (
    <>
      <hemisphereLight args={['#DFF4FF', '#F2D49B', 1.4]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[6, 12, 7]}
        intensity={2.8}
        castShadow
        shadow-mapSize-width={1536}
        shadow-mapSize-height={1536}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-bias={-0.0006}
      />
      <fog attach="fog" args={['#CFEFFF', 22, 48]} />
      <Ocean />
      <Sky />
      <BoardBase />
      <CenterSea />
      <CornerProps />
      {TILES.map((t) => (
        <Tile key={t.index} index={t.index} mortgaged={isOwnable(t) && game.board[t.index].mortgaged} onClick={onTileClick} />
      ))}
      {TILES.filter(isOwnable).map((t) => (
        <TileOwnership key={t.index} index={t.index} game={game} />
      ))}
      {game.players
        .filter((p) => !p.bankrupt)
        .map((p) => {
          const at = pos[p.id] ?? p.position;
          const key = p.inJail && at === 10 ? 100 : at;
          const g = groups[key];
          const k = g.indexOf(p.id);
          let target: [number, number];
          if (key === 100) {
            const r = TILE_RECTS[10];
            target = [r.x + 0.3 + (k % 2) * 0.24, r.z - 0.3 - Math.floor(k / 2) * 0.24];
          } else target = standPoint(at, k, g.length);
          return (
            <Pawn
              key={p.id}
              id={p.id}
              token={p.token}
              color={p.color}
              target={target}
              stepMs={STEP_MS_3D}
              active={p.id === current.id && game.phase !== 'gameOver'}
              jailed={p.inJail}
              registry={registry}
            />
          );
        })}
      <Dice3D roll={diceRoll} resting={game.lastDice} onDone={onDiceDone} />
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5}
        maxDistance={30}
        minPolarAngle={0.25}
        maxPolarAngle={1.25}
        enableDamping
      />
      <CameraRig follow={() => (mover ? (registry.get(mover) ?? null) : null)} resetTick={resetTick} />
    </>
  );
}

export default function Board3D(props: Props) {
  const { game, onSwitch2D } = props;
  const [resetTick, setResetTick] = useState(0);
  const [lost, setLost] = useState(false);
  const dice = game.lastDice;

  if (lost)
    return (
      <div className="board3d board3d-lost">
        <p>Tampilan 3D berhenti (perangkat kehabisan memori grafis).</p>
        <button className="btn" onClick={onSwitch2D}>
          Pakai tampilan 2D
        </button>
      </div>
    );

  return (
    <div className="board3d">
      <Canvas
        shadows
        flat
        dpr={[1, 1.75]}
        camera={{ fov: 40, position: [0, 10, 12], near: 0.1, far: 140 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setLost(true);
          });
        }}
      >
        <Suspense fallback={null}>
          <Scene
            game={props.game}
            onTileClick={props.onTileClick}
            onAnimating={props.onAnimating}
            diceRoll={props.diceRoll}
            onDiceDone={props.onDiceDone}
            resetTick={resetTick}
          />
        </Suspense>
      </Canvas>
      <div className="hud-tl">
        <div className="hud-chip" title="Kumpulan denda & pungli. Diambil semua oleh yang berhenti di Warkop.">
          ☕ Kas Warkop <strong>{rp(game.warkop)}</strong>
        </div>
        <div className="hud-chip" title="Iuran Rp 10 jt setiap lewat MULAI. Diambil oleh kartu Narik Arisan!">
          🪙 Kas Arisan <strong>{rp(game.arisan)}</strong>
        </div>
      </div>
      <div className="hud-tr">
        <button className="hud-btn" onClick={() => setResetTick((t) => t + 1)} title="Kembalikan kamera" aria-label="Kembalikan kamera">
          🎥
        </button>
        <button className="hud-btn" onClick={onSwitch2D} title="Ganti ke tampilan 2D (ringan)" aria-label="Ganti ke tampilan 2D">
          2D
        </button>
      </div>
      {dice && !props.rolling && (
        <div className="hud-dice" aria-live="polite">
          🎲 {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
          {dice[0] === dice[1] ? ' · DOBEL!' : ''}
        </div>
      )}
      <div className="hud-hint">Seret untuk memutar · cubit/scroll untuk zoom · ketuk petak untuk info</div>
    </div>
  );
}
