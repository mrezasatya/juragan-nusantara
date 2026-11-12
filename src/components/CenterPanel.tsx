import { useEffect, useState } from 'react';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import { Die, GununganBack, KentonganBack } from './Art.tsx';
import Logo from './Logo.tsx';

export default function CenterPanel({ game, rolling }: { game: GameState; rolling: boolean }) {
  const [face, setFace] = useState<[number, number]>([3, 4]);
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFace([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]), 80);
    return () => clearInterval(t);
  }, [rolling]);
  const dice = rolling ? face : game.lastDice;

  return (
    <div className="center">
      <Logo />
      <div className="center-kas">
        <div className="kas kas-warkop" title="Kumpulan denda, pungli, dan iuran. Diambil semua oleh pemain yang berhenti di Warkop.">
          <span>☕ Kas Warkop</span>
          <strong>{rp(game.warkop)}</strong>
        </div>
        <div className="kas kas-arisan" title="Iuran Rp 10 jt setiap lewat MULAI. Diambil oleh pemegang kartu Narik Arisan!">
          <span>🪙 Kas Arisan</span>
          <strong>{rp(game.arisan)}</strong>
        </div>
      </div>
      <div className="center-dice" aria-live="polite">
        {dice ? (
          <>
            <Die value={dice[0]} rolling={rolling} />
            <Die value={dice[1]} rolling={rolling} />
            {!rolling && <span className="dice-total">= {dice[0] + dice[1]}</span>}
          </>
        ) : (
          <span className="muted small">Belum melempar dadu</span>
        )}
      </div>
      <div className="center-decks" aria-hidden>
        <div className="deck">
          <GununganBack />
          <span>Nasib</span>
        </div>
        <div className="deck">
          <KentonganBack />
          <span>Warga</span>
        </div>
      </div>
    </div>
  );
}
