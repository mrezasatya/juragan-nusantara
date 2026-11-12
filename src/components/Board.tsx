import type { ReactNode } from 'react';
import { useAnimatedPositions } from '../ui/useAnimatedPositions.ts';
import { GROUP_BY_ID, TILES, isOwnable } from '../engine/data.ts';
import { rp } from '../engine/format.ts';
import type { GameState, Tile } from '../engine/types.ts';
import { GRID_TEMPLATE, gridPos, tileCenter } from '../ui/geometry.ts';
import { tokenEmoji } from '../ui/constants.ts';
import { Buildings } from './Art.tsx';

interface Props {
  game: GameState;
  onTileClick: (i: number) => void;
  onAnimating: (busy: boolean) => void;
  highlight?: number | null;
  children?: ReactNode;
}

const STEP_MS = 140;

// Titik pemenggalan (soft hyphen) untuk kata panjang di petak kecil.
const SOFT: Record<string, string> = {
  Khatulistiwa: 'Khatu\u00ADlis\u00ADtiwa',
  Penghasilan: 'Peng\u00ADhasilan',
  Terapung: 'Tera\u00ADpung',
  Kepulauan: 'Kepu\u00ADlauan',
  Jembatan: 'Jem\u00ADbatan',
  Pelabuhan: 'Pela\u00ADbuhan',
};
const soft = (s: string) => s.replace(/[A-Za-z]{8,}/g, (w) => SOFT[w] ?? w);

export default function Board({ game, onTileClick, onAnimating, highlight, children }: Props) {
  const { pos } = useAnimatedPositions(game, onAnimating, STEP_MS);
  const current = game.players[game.current];

  // Kelompokkan pion per petak untuk diberi jarak.
  const byTile: Record<number, string[]> = {};
  for (const p of game.players) if (!p.bankrupt) (byTile[pos[p.id] ?? p.position] ??= []).push(p.id);

  return (
    <div className="board" style={{ gridTemplateColumns: GRID_TEMPLATE, gridTemplateRows: GRID_TEMPLATE }}>
      {TILES.map((t) => (
        <TileCell key={t.index} tile={t} game={game} onClick={() => onTileClick(t.index)} highlight={highlight === t.index} />
      ))}
      <div className="board-center">{children}</div>
      <div className="token-layer" aria-hidden>
        {game.players
          .filter((p) => !p.bankrupt)
          .map((p) => {
            const at = pos[p.id] ?? p.position;
            const c = tileCenter(at);
            const group = byTile[at] ?? [];
            const k = group.indexOf(p.id);
            const off = group.length > 1 ? spread(k, group.length) : { dx: 0, dy: 0 };
            return (
              <div
                key={p.id}
                className={`token ${p.id === current.id ? 'token-active' : ''} ${p.inJail ? 'token-jail' : ''}`}
                style={{
                  left: `calc(${c.x}% + ${off.dx}cqw)`,
                  top: `calc(${c.y}% + ${off.dy}cqw)`,
                  borderColor: p.color,
                  zIndex: p.id === current.id ? 5 : 2,
                }}
              >
                <span>{tokenEmoji(p.token)}</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function spread(k: number, n: number) {
  const r = n <= 2 ? 1.4 : n <= 4 ? 2 : 2.6;
  const a = (k / n) * Math.PI * 2 - Math.PI / 2;
  return { dx: Math.cos(a) * r, dy: Math.sin(a) * r };
}

function TileCell({ tile, game, onClick, highlight }: { tile: Tile; game: GameState; onClick: () => void; highlight: boolean }) {
  const { row, col, side } = gridPos(tile.index);
  const own = isOwnable(tile) ? game.board[tile.index] : null;
  const owner = own?.owner ? game.players.find((p) => p.id === own.owner) : null;
  const group = tile.kind === 'property' ? GROUP_BY_ID[tile.group] : null;
  const cls = [
    'tile',
    `tile-${side}`,
    `kind-${tile.kind}`,
    own?.mortgaged ? 'mortgaged' : '',
    highlight ? 'tile-hl' : '',
  ].join(' ');
  const label =
    tile.kind === 'property' ? `${tile.provinceShort} — ${tile.landmark}` : tile.short;
  return (
    <button
      className={cls}
      style={{ gridRow: row, gridColumn: col }}
      onClick={onClick}
      aria-label={`${label}${owner ? `, milik ${owner.name}` : ''}`}
      title={tile.name}
    >
      {group && <span className="tile-band" style={{ background: group.color }} />}
      <span className="tile-body">
        <span className="tile-icon">{tile.icon}</span>
        <span className="tile-name">{soft(tile.kind === 'property' ? tile.landmark : tile.short)}</span>
        {isOwnable(tile) && !owner && <span className="tile-price">{rp(tile.price)}</span>}
        {tile.kind === 'tax' && <span className="tile-price">{tile.percent ? 'Rp 200 jt / 10%' : rp(tile.amount)}</span>}
      </span>
      {own && own.level > 0 && <Buildings level={own.level} />}
      {owner && <span className="tile-owner" style={{ background: owner.color }} title={owner.name} />}
      {own?.mortgaged && <span className="tile-mort">GADAI</span>}
    </button>
  );
}
