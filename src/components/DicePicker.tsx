import { useState } from 'react';
import { Die } from './Art.tsx';

/** Input angka dadu fisik (Mode Dadu Fisik). */
export function DicePicker({ count, onDone, label }: { count: 1 | 2; onDone: (d: number[]) => void; label?: string }) {
  const [vals, setVals] = useState<(number | null)[]>(Array(count).fill(null));
  const ready = vals.every((v) => v !== null);
  return (
    <div className="dice-picker">
      {label && <p>{label}</p>}
      {vals.map((v, k) => (
        <div key={k} className="dice-picker-row">
          <span className="muted">Dadu {count > 1 ? k + 1 : ''}</span>
          <div className="dice-picker-faces">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                className={v === n ? 'on' : ''}
                aria-label={`Dadu ${k + 1}: ${n}`}
                onClick={() => setVals((a) => a.map((x, j) => (j === k ? n : x)))}
              >
                <Die value={n} size={34} />
              </button>
            ))}
          </div>
        </div>
      ))}
      <button className="btn btn-primary" disabled={!ready} onClick={() => onDone(vals as number[])}>
        {ready && count === 2 ? `Jalan ${(vals[0] ?? 0) + (vals[1] ?? 0)} petak` : 'OK'}
      </button>
    </div>
  );
}
