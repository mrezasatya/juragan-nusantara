import { useLayoutEffect, useRef, useState } from 'react';
import type { GameState } from '../engine/types.ts';

/** Posisi pion yang ditampilkan, dianimasikan petak demi petak mengikuti event gerak dari engine. */
export function useAnimatedPositions(game: GameState, onAnimating: (b: boolean) => void, stepMs: number) {
  const [pos, setPos] = useState<Record<string, number>>(() =>
    Object.fromEntries(game.players.map((p) => [p.id, p.position])),
  );
  const [mover, setMover] = useState<string | null>(null);
  const lastSeq = useRef(game.moveSeq);
  const queue = useRef<{ player: string; path: number[] }[]>([]);
  const running = useRef(false);
  const cb = useRef(onAnimating);
  cb.current = onAnimating;

  // useLayoutEffect: status "sedang berjalan" diset sebelum layar digambar,
  // supaya tombol giliran tidak sempat muncul sebelum pion mulai berjalan.
  useLayoutEffect(() => {
    const fresh = game.moves.filter((m) => m.seq > lastSeq.current);
    lastSeq.current = game.moveSeq;
    if (!fresh.length) {
      // Sinkronkan jika ada perbedaan (mis. permainan baru dimuat).
      if (!running.current) setPos(Object.fromEntries(game.players.map((p) => [p.id, p.position])));
      return;
    }
    for (const m of fresh) {
      const path: number[] = [];
      if (m.mode === 'jump') path.push(m.to);
      else {
        const dir = m.mode === 'walk' ? 1 : -1;
        let i = m.from;
        for (let guard = 0; guard < 40 && i !== m.to; guard++) {
          i = (i + dir + 40) % 40;
          path.push(i);
        }
        if (!path.length) path.push(m.to);
      }
      queue.current.push({ player: m.player, path });
    }
    if (running.current) return;
    running.current = true;
    cb.current(true);
    const tick = () => {
      const job = queue.current[0];
      if (!job) {
        running.current = false;
        setMover(null);
        cb.current(false);
        return;
      }
      setMover(job.player);
      const next = job.path.shift()!;
      setPos((p) => ({ ...p, [job.player]: next }));
      if (!job.path.length) queue.current.shift();
      setTimeout(tick, job.path.length ? stepMs : stepMs * 2);
    };
    setTimeout(tick, 60);
  }, [game.moveSeq, game.moves, game.players, stepMs]);

  return { pos, mover };
}
