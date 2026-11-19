// Potret wajah karakter pion (SVG), senada dengan figurin 3D.
// Dipakai di pemilihan pion, panel pemain, topbar, papan 2D, dan layar pemenang.

import { tokenInfo, normalizeToken, type CharacterId } from '../ui/constants.ts';

const OUTFIT: Record<CharacterId, string> = {
  ojol: '#2FA84F',
  kos: '#F2EFE8',
  warung: '#7B4FA0',
  kantoran: '#FAFAFA',
  pns: '#B9A16B',
  sd: '#FAFAFA',
  punk: '#2A2A2A',
  mie: '#6E8B3D',
};

const INK = '#2B1A10';

function Eyes({ happy }: { happy?: boolean }) {
  if (happy)
    return (
      <g fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round">
        <path d="M34 50 q5 -6 10 0" />
        <path d="M56 50 q5 -6 10 0" />
      </g>
    );
  return (
    <g>
      <ellipse cx="39" cy="50" rx="4.6" ry="5.6" fill={INK} />
      <ellipse cx="61" cy="50" rx="4.6" ry="5.6" fill={INK} />
      <circle cx="40.6" cy="47.8" r="1.6" fill="#fff" />
      <circle cx="62.6" cy="47.8" r="1.6" fill="#fff" />
    </g>
  );
}

function Hair({ id }: { id: CharacterId }) {
  switch (id) {
    case 'ojol':
      return (
        <g>
          <path d="M18 50 C18 22 82 22 82 50 L82 44 C80 18 20 18 18 44 Z" fill="#1E7A37" />
          <path d="M16 46 C16 14 84 14 84 46 C76 34 24 34 16 46 Z" fill="#2FA84F" stroke={INK} strokeWidth="2.5" />
          <rect x="34" y="21" width="32" height="5" rx="2.5" fill="#1E7A37" />
          <path d="M20 46 L22 66 M80 46 L78 66" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'kos':
    case 'sd':
      return (
        <g>
          <path d="M20 46 C18 18 82 18 80 46 C70 34 30 34 20 46 Z" fill="#1A120C" />
          {id === 'sd' && <path d="M34 34 l5 8 l4 -8 l5 8 l4 -8 l5 8 l4 -8" fill="#1A120C" stroke="#1A120C" strokeWidth="3" strokeLinejoin="round" />}
        </g>
      );
    case 'warung':
      return (
        <g>
          <circle cx="50" cy="16" r="10" fill="#3A3A3A" stroke={INK} strokeWidth="2" />
          <path d="M19 48 C16 18 84 18 81 48 C72 30 28 30 19 48 Z" fill="#3A3A3A" />
          <rect x="40" y="22" width="20" height="3" rx="1.5" fill="#C9A227" />
        </g>
      );
    case 'kantoran':
      return (
        <g>
          <path d="M20 46 C18 18 82 18 80 46 C72 30 40 28 20 46 Z" fill="#1A120C" />
          <path d="M44 22 C58 14 74 20 76 34 C66 26 56 26 44 22 Z" fill="#1A120C" />
        </g>
      );
    case 'pns':
      return (
        <g>
          <path d="M20 48 C20 34 80 34 80 48 C72 40 28 40 20 48 Z" fill="#1A120C" />
          <path d="M24 34 L27 16 Q50 10 73 16 L76 34 Q50 28 24 34 Z" fill="#151515" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'punk':
      return (
        <g>
          <path d="M22 46 C20 28 80 28 78 46 C70 38 30 38 22 46 Z" fill="#3A3A3A" opacity="0.8" />
          {[0, 1, 2, 3, 4].map((k) => (
            <path key={k} d={`M${36 + k * 7} 30 L${39 + k * 7} ${8 + (k % 2) * 4} L${42 + k * 7} 30 Z`} fill={k % 2 ? '#C0392B' : '#1A1A1A'} />
          ))}
        </g>
      );
    case 'mie':
      return (
        <g fill="#1A120C">
          {[
            [26, 34],
            [34, 24],
            [44, 19],
            [56, 19],
            [66, 24],
            [74, 34],
            [50, 26],
            [38, 30],
            [62, 30],
          ].map(([x, y], k) => (
            <circle key={k} cx={x} cy={y} r="9" />
          ))}
        </g>
      );
  }
}

/** Potret karakter berbingkai lingkaran. */
export default function Avatar({ token, size = 40, ring }: { token: string; size?: number; ring?: string }) {
  const id = normalizeToken(token);
  const info = tokenInfo(id);
  const outfit = OUTFIT[id];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={info.label} className="avatar">
      <circle cx="50" cy="50" r="48" fill="#FFF3DD" stroke={ring ?? '#E2CFA8'} strokeWidth={ring ? 5 : 3} />
      <clipPath id={`av-${id}`}>
        <circle cx="50" cy="50" r="46" />
      </clipPath>
      <g clipPath={`url(#av-${id})`}>
        {/* bahu & baju */}
        <path d="M14 104 C14 80 30 74 50 74 C70 74 86 80 86 104 Z" fill={outfit} stroke={INK} strokeWidth="2.5" />
        {id === 'kantoran' && <path d="M47 76 L53 76 L55 98 L50 102 L45 98 Z" fill="#1F3F8B" />}
        {id === 'sd' && <rect x="56" y="82" width="8" height="8" fill="#C0392B" />}
        {id === 'ojol' && (
          <g>
            <rect x="30" y="84" width="10" height="3" fill="#C0392B" />
            <rect x="30" y="87" width="10" height="3" fill="#fff" />
          </g>
        )}
        {id === 'punk' && <circle cx="50" cy="90" r="5" fill="#EDEDED" />}
        {/* leher & kepala */}
        <rect x="43" y="66" width="14" height="12" fill={info.skin} />
        <circle cx="50" cy="48" r="29" fill={info.skin} stroke={INK} strokeWidth="2.5" />
        <circle cx="21" cy="50" r="5" fill={info.skin} stroke={INK} strokeWidth="2" />
        <circle cx="79" cy="50" r="5" fill={info.skin} stroke={INK} strokeWidth="2" />
        <Hair id={id} />
        <Eyes happy={id === 'mie'} />
        {/* alis */}
        <g stroke={INK} strokeWidth="2.4" strokeLinecap="round">
          {id === 'punk' ? (
            <>
              <path d="M33 40 L45 43" />
              <path d="M67 40 L55 43" />
            </>
          ) : (
            <>
              <path d="M34 41 L44 40" />
              <path d="M56 40 L66 41" />
            </>
          )}
        </g>
        {id === 'kantoran' && (
          <g fill="none" stroke={INK} strokeWidth="2.4">
            <circle cx="39" cy="50" r="8" />
            <circle cx="61" cy="50" r="8" />
            <path d="M47 50 L53 50" />
          </g>
        )}
        {/* pipi & mulut */}
        <ellipse cx="30" cy="58" rx="5" ry="3" fill="#F09A8A" opacity="0.8" />
        <ellipse cx="70" cy="58" rx="5" ry="3" fill="#F09A8A" opacity="0.8" />
        <path d="M42 62 Q50 70 58 62" fill={id === 'mie' ? '#7A2E1D' : 'none'} stroke="#7A2E1D" strokeWidth="2.6" strokeLinecap="round" />
        {id === 'kos' && <path d="M40 59 Q45 55 50 58 Q55 55 60 59" fill="none" stroke="#1A120C" strokeWidth="4" strokeLinecap="round" />}
        {id === 'punk' && <circle cx="21" cy="57" r="2.4" fill="none" stroke="#D9D9D9" strokeWidth="1.6" />}
      </g>
    </svg>
  );
}
