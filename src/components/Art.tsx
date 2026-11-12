// Ilustrasi SVG sederhana: bangunan, punggung kartu, dan dadu.

export function Homestay({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path d="M1 10 L10 2 L19 10 Z" fill="#B5442C" stroke="#6B4226" strokeWidth="1" />
      <rect x="4" y="10" width="12" height="8" fill="#F4E9D3" stroke="#6B4226" strokeWidth="1" />
      <rect x="8.5" y="12.5" width="3" height="5.5" fill="#6B4226" />
    </svg>
  );
}

export function Resort({ size = 14 }: { size?: number }) {
  // Atap tumpang (bertingkat) khas bangunan tradisional.
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 1 L17 6 H7 Z" fill="#B5442C" stroke="#6B4226" strokeWidth="0.8" />
      <path d="M12 4 L20 11 H4 Z" fill="#B5442C" stroke="#6B4226" strokeWidth="0.8" />
      <path d="M12 8 L23 16 H1 Z" fill="#B5442C" stroke="#6B4226" strokeWidth="0.8" />
      <rect x="4" y="16" width="16" height="7" fill="#E3A21A" stroke="#6B4226" strokeWidth="0.8" />
      <rect x="10.5" y="18" width="3" height="5" fill="#6B4226" />
    </svg>
  );
}

export function Buildings({ level }: { level: number }) {
  return (
    <span className="tile-buildings" aria-label={level === 5 ? 'Resort' : `${level} Homestay`}>
      {level === 5 ? <Resort /> : Array.from({ length: level }, (_, i) => <Homestay key={i} />)}
    </span>
  );
}

/** Punggung Kartu Nasib: siluet gunungan wayang. */
export function GununganBack() {
  return (
    <svg viewBox="0 0 100 140" className="card-back-art" aria-hidden>
      <rect width="100" height="140" rx="8" fill="#B5442C" />
      <rect x="5" y="5" width="90" height="130" rx="6" fill="none" stroke="#E3A21A" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M50 14 C66 34 78 58 78 84 C78 104 66 118 50 122 C34 118 22 104 22 84 C22 58 34 34 50 14 Z" fill="#6B4226" stroke="#E3A21A" strokeWidth="2" />
      <path d="M50 30 V112 M50 50 L38 62 M50 50 L62 62 M50 66 L34 80 M50 66 L66 80 M50 84 L36 96 M50 84 L64 96" stroke="#E3A21A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="40" y="104" width="20" height="14" fill="#E3A21A" />
    </svg>
  );
}

/** Punggung Kartu Warga: pos ronda dan kentongan. */
export function KentonganBack() {
  return (
    <svg viewBox="0 0 100 140" className="card-back-art" aria-hidden>
      <rect width="100" height="140" rx="8" fill="#1F5F8B" />
      <rect x="5" y="5" width="90" height="130" rx="6" fill="none" stroke="#E3A21A" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M14 56 L50 30 L86 56 Z" fill="#6B4226" stroke="#E3A21A" strokeWidth="2" />
      <rect x="20" y="56" width="6" height="58" fill="#6B4226" />
      <rect x="74" y="56" width="6" height="58" fill="#6B4226" />
      <rect x="16" y="100" width="68" height="8" fill="#6B4226" />
      <line x1="50" y1="56" x2="50" y2="64" stroke="#E3A21A" strokeWidth="2" />
      <rect x="43" y="64" width="14" height="32" rx="6" fill="#E3A21A" stroke="#6B4226" strokeWidth="2" />
      <rect x="48" y="70" width="4" height="20" rx="2" fill="#6B4226" />
    </svg>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

export function Die({ value, rolling = false, size = 44 }: { value: number; rolling?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`die ${rolling ? 'die-rolling' : ''}`} role="img" aria-label={`dadu ${value}`}>
      <rect x="4" y="4" width="92" height="92" rx="18" fill="#FFFDF7" stroke="#6B4226" strokeWidth="5" />
      {PIPS[value]?.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill={value === 1 ? '#B5442C' : '#6B4226'} />
      ))}
    </svg>
  );
}
