import { ranking, ownedTiles } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import { tokenEmoji } from '../ui/constants.ts';
import Modal from './Modal.tsx';

export default function GameOver({ game, onHome, onNewGame }: { game: GameState; onHome: () => void; onNewGame: () => void }) {
  const rows = ranking(game);
  const winner = rows[0].player;
  const minutes = Math.round((Date.now() - game.startedAt) / 60000);
  return (
    <Modal title="🏆 Permainan Selesai" className="modal-gameover">
      <div className="winner" style={{ borderColor: winner.color }}>
        <span className="winner-token" style={{ background: winner.color }}>
          {tokenEmoji(winner.token)}
        </span>
        <div>
          <div className="small muted">Juragan Nusantara</div>
          <div className="winner-name">{winner.name}</div>
          <div className="small">{game.endReason}</div>
        </div>
      </div>
      <table className="rank-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Pemain</th>
            <th>Properti</th>
            <th>Total aset</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.player.id}>
              <td>{i + 1}</td>
              <td>
                <span className="dot" style={{ background: r.player.color }} /> {r.player.name}
              </td>
              <td>{r.player.bankrupt ? '—' : ownedTiles(game, r.player.id).length}</td>
              <td>{r.player.bankrupt ? 'Bangkrut' : rp(r.worth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">
        {game.round} putaran · {game.turnCount} giliran{game.startedAt ? ` · sekitar ${minutes} menit` : ''}
      </p>
      <div className="prompt-actions">
        <button className="btn btn-primary btn-lg" onClick={onNewGame}>
          Main Lagi
        </button>
        <button className="btn" onClick={onHome}>
          Ke Beranda
        </button>
      </div>
    </Modal>
  );
}
