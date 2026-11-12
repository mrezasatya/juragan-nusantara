import type { Dispatch } from '../App.tsx';
import { GROUP_BY_ID, TILES, ownable } from '../engine/data.ts';
import {
  canBuild,
  canMortgage,
  canSellBuilding,
  canUnmortgage,
  getPlayer,
  managingPlayer,
  ownedTiles,
  sellValue,
  unmortgageCost,
} from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import Modal from './Modal.tsx';

export default function ManageModal({ game, dispatch, onClose }: { game: GameState; dispatch: Dispatch; onClose: () => void }) {
  const who = managingPlayer(game);
  if (!who) return null;
  const p = getPlayer(game, who);
  const tiles = ownedTiles(game, who);
  const inDebt = game.prompt?.type === 'debt';

  return (
    <Modal title={`🏗️ Kelola Aset — ${p.name}`} onClose={onClose} className="modal-wide">
      <p className="prompt-line">
        Uang: <strong>{rp(p.cash)}</strong>
        {inDebt && game.prompt?.type === 'debt' && (
          <>
            {' '}
            · perlu <strong>{rp(game.prompt.amount)}</strong>
          </>
        )}
      </p>
      {tiles.length === 0 && <p className="muted">Belum punya properti.</p>}
      <div className="manage-list">
        {tiles.map((i) => {
          const t = TILES[i];
          const o = game.board[i];
          const color = t.kind === 'property' ? GROUP_BY_ID[t.group].color : '#8a7a68';
          const lvl = o.level === 5 ? 'Resort' : o.level > 0 ? `${o.level} Homestay` : '';
          return (
            <div key={i} className={`manage-row ${o.mortgaged ? 'mortgaged' : ''}`} style={{ borderLeftColor: color }}>
              <div className="manage-name">
                {t.icon} <strong>{t.short}</strong>
                <span className="small muted">
                  {lvl}
                  {o.mortgaged ? ' · digadai' : ''}
                </span>
              </div>
              <div className="manage-btns">
                {t.kind === 'property' && !inDebt && (
                  <button className="btn btn-sm" disabled={!canBuild(game, who, i)} onClick={() => dispatch({ type: 'BUILD', tile: i })}>
                    + {o.level === 4 ? 'Resort' : 'Homestay'} ({rp(t.buildCost)})
                  </button>
                )}
                {t.kind === 'property' && o.level > 0 && (
                  <button className="btn btn-sm" disabled={!canSellBuilding(game, who, i)} onClick={() => dispatch({ type: 'SELL_BUILDING', tile: i })}>
                    − Jual ({rp(sellValue(i))})
                  </button>
                )}
                {!o.mortgaged ? (
                  <button className="btn btn-sm" disabled={!canMortgage(game, who, i)} onClick={() => dispatch({ type: 'MORTGAGE', tile: i })}>
                    Gadai (+{rp(ownable(i).mortgage)})
                  </button>
                ) : (
                  !inDebt && (
                    <button className="btn btn-sm" disabled={!canUnmortgage(game, who, i)} onClick={() => dispatch({ type: 'UNMORTGAGE', tile: i })}>
                      Tebus ({rp(unmortgageCost(i))})
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <details className="hint-box">
        <summary>Aturan singkat</summary>
        <ul>
          <li>Bangun hanya jika punya <strong>satu grup warna lengkap</strong> dan tidak ada yang digadai.</li>
          <li>Bangun harus <strong>merata</strong>: selisih jumlah Homestay antarpetak maksimal 1. 4 Homestay → 1 Resort.</li>
          <li>Bangunan dijual ke Bank setengah harga.</li>
          <li>Gadai = 50% harga; tebus = nilai gadai + 10%. Properti tergadai tidak menghasilkan sewa.</li>
          <li>Jual dulu semua bangunan di grupnya sebelum menggadaikan properti.</li>
        </ul>
      </details>
      <div className="prompt-actions">
        <button className="btn btn-primary" onClick={onClose}>
          Selesai
        </button>
      </div>
    </Modal>
  );
}
