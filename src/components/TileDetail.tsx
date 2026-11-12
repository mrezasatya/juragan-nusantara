import { CONFIG, GROUP_BY_ID, TILES, groupMembers, isOwnable } from '../engine/data.ts';
import { calcRent, getPlayer, unmortgageCost } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import Modal from './Modal.tsx';

export function PropertyCard({ game, index, compact = false }: { game: GameState; index: number; compact?: boolean }) {
  const t = TILES[index];
  const own = isOwnable(t) ? game.board[index] : null;
  const owner = own?.owner ? getPlayer(game, own.owner) : null;

  if (t.kind === 'property') {
    const g = GROUP_BY_ID[t.group];
    const labels = ['Sewa dasar', '1 Homestay', '2 Homestay', '3 Homestay', '4 Homestay', 'Resort'];
    return (
      <div className={`prop-card motif-${t.group}`} style={{ ['--group' as string]: g.color }}>
        <div className="prop-card-head">
          <span className="prop-card-group">
            Grup {g.name} · {g.region}
          </span>
          <h3>
            {t.icon} {t.landmark}
          </h3>
          <span className="prop-card-prov">{t.province}</span>
        </div>
        <div className="prop-card-body">
          <p className="prop-fact">{t.fact}</p>
          {t.greeting && <p className="prop-greet">{t.greeting}</p>}
          {!compact && (
            <table className="rent-table">
              <tbody>
                {t.rent.map((r, i) => (
                  <tr key={i} className={own && own.owner && own.level === i ? 'on' : ''}>
                    <td>{labels[i]}</td>
                    <td>{rp(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {compact && (
            <p className="small">
              Sewa dasar {rp(t.rent[0])} (2× jika punya satu grup) · dengan Resort {rp(t.rent[5])}
            </p>
          )}
          <div className="prop-meta">
            <span>Harga {rp(t.price)}</span>
            <span>Bangun {rp(t.buildCost)}/unit</span>
            <span>Gadai {rp(t.mortgage)}</span>
          </div>
          <p className="small muted">Satu grup: {groupMembers(t.group).map((i) => TILES[i].short).join(', ')}</p>
        </div>
        <div className="prop-card-foot">Motif bingkai: {g.motif}</div>
        {owner && <OwnerLine game={game} index={index} />}
      </div>
    );
  }

  return (
    <div className={`prop-card kind-${t.kind}`}>
      <div className="prop-card-head plain">
        <h3>
          {t.icon} {t.short}
        </h3>
        {t.name !== t.short && <span className="prop-card-prov">{t.name}</span>}
      </div>
      <div className="prop-card-body">
        {t.caption && <p className="caption">"{t.caption}"</p>}
        {t.rule && <p>{t.rule}</p>}
        {(t.kind === 'transport' || t.kind === 'utility') && (
          <div className="prop-meta">
            <span>Harga {rp(t.price)}</span>
            <span>Gadai {rp(t.mortgage)}</span>
          </div>
        )}
      </div>
      {owner && <OwnerLine game={game} index={index} />}
    </div>
  );
}

function OwnerLine({ game, index }: { game: GameState; index: number }) {
  const o = game.board[index];
  const owner = getPlayer(game, o.owner!);
  const t = TILES[index];
  const rent = calcRent(game, index, 7);
  return (
    <div className="owner-line" style={{ borderColor: owner.color }}>
      Milik <strong>{owner.name}</strong>
      {o.mortgaged
        ? ` · sedang digadai (tebus ${rp(unmortgageCost(index))})`
        : t.kind === 'utility'
          ? ` · sewa = dadu × ${rp(CONFIG.utilityMultiplier[rent / 7 === CONFIG.utilityMultiplier[1] ? 1 : 0])}`
          : ` · sewa sekarang ${rp(rent)}`}
      {o.level > 0 && ` · ${o.level === 5 ? 'Resort' : `${o.level} Homestay`}`}
    </div>
  );
}

export default function TileDetail({ game, index, onClose }: { game: GameState; index: number; onClose: () => void }) {
  const here = game.players.filter((p) => !p.bankrupt && p.position === index);
  return (
    <Modal title={`Petak ${index}`} onClose={onClose}>
      <PropertyCard game={game} index={index} />
      {here.length > 0 && <p className="small muted">Di sini: {here.map((p) => p.name).join(', ')}</p>}
    </Modal>
  );
}
