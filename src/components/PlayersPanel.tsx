import { CARD_BY_ID, GROUP_BY_ID, TILES } from '../engine/data.ts';
import { getPlayer, loanDue, netWorth, ownedTiles } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import { ITEM_HELP, ITEM_LABEL, tokenEmoji } from '../ui/constants.ts';

export default function PlayersPanel({ game, onTile }: { game: GameState; onTile: (i: number) => void }) {
  return (
    <div className="players">
      {game.players.map((p, idx) => {
        const tiles = ownedTiles(game, p.id);
        const loans = game.loans.filter((l) => l.borrower === p.id || l.lender === p.id);
        return (
          <div key={p.id} className={`player ${idx === game.current ? 'player-on' : ''} ${p.bankrupt ? 'player-out' : ''}`} style={{ borderColor: p.color }}>
            <div className="player-head">
              <span className="player-token" style={{ background: p.color }}>
                {tokenEmoji(p.token)}
              </span>
              <strong className="player-name">{p.name}</strong>
              <span className="player-cash">{p.bankrupt ? 'Bangkrut' : rp(p.cash)}</span>
            </div>
            {!p.bankrupt && (
              <>
                <div className="player-status">
                  {p.inJail && <span className="chip chip-bad">🛋️ Hotel Prodeo</span>}
                  {p.skipTurns > 0 && <span className="chip chip-bad">⏸ Diam {p.skipTurns}×</span>}
                  {p.deferred.map((d) => (
                    <span key={d.id} className="chip chip-bad" title="Ditagih saat lewat MULAI berikutnya">
                      ⏳ Pinjol {rp(d.amount)}
                    </span>
                  ))}
                  {p.items.map((it) => (
                    <span key={it.cardId} className="chip chip-good" title={`${CARD_BY_ID[it.cardId].title}: ${ITEM_HELP[it.kind]}`}>
                      🎴 {ITEM_LABEL[it.kind]}
                    </span>
                  ))}
                  {loans.map((l) =>
                    l.borrower === p.id ? (
                      <span key={l.id} className="chip chip-bad" title={`Jatuh tempo putaran ${l.dueRound}`}>
                        Utang {rp(loanDue(l.principal, l.interestPct))} ke {getPlayer(game, l.lender).name}
                      </span>
                    ) : (
                      <span key={l.id} className="chip" title={`Jatuh tempo putaran ${l.dueRound}`}>
                        Piutang {rp(loanDue(l.principal, l.interestPct))} dari {getPlayer(game, l.borrower).name}
                      </span>
                    ),
                  )}
                </div>
                {tiles.length > 0 && (
                  <div className="player-props">
                    {tiles.map((i) => {
                      const t = TILES[i];
                      const o = game.board[i];
                      const color = t.kind === 'property' ? GROUP_BY_ID[t.group].color : '#8a7a68';
                      return (
                        <button
                          key={i}
                          className={`prop-chip ${o.mortgaged ? 'mortgaged' : ''}`}
                          style={{ borderLeftColor: color }}
                          onClick={() => onTile(i)}
                          title={t.name}
                        >
                          {t.icon} {t.short}
                          {o.level > 0 && <em>{o.level === 5 ? ' 🏨' : ` 🏠${o.level}`}</em>}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div className="player-worth small muted">Total aset bersih: {rp(netWorth(game, p.id))}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
