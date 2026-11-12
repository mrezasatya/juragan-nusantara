import { useState } from 'react';
import type { Dispatch } from '../App.tsx';
import { CARD_BY_ID, TILES } from '../engine/data.ts';
import { canTradeTile, currentPlayer, ownedTiles } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState, Player, TradeOffer } from '../engine/types.ts';
import { ITEM_LABEL } from '../ui/constants.ts';
import Modal from './Modal.tsx';

const empty = (): TradeOffer => ({ cash: 0, tiles: [], items: [] });

export default function TradeModal({ game, dispatch, onClose }: { game: GameState; dispatch: Dispatch; onClose: () => void }) {
  const me = currentPlayer(game);
  const others = game.players.filter((p) => !p.bankrupt && p.id !== me.id);
  const [partnerId, setPartnerId] = useState(others[0]?.id ?? '');
  const [mine, setMine] = useState<TradeOffer>(empty);
  const [theirs, setTheirs] = useState<TradeOffer>(empty);
  const [agreed, setAgreed] = useState(false);
  const partner = others.find((p) => p.id === partnerId);
  if (!partner) return null;

  const submit = () => {
    if (dispatch({ type: 'TRADE', a: me.id, b: partner.id, aGives: mine, bGives: theirs })) onClose();
  };
  const isEmpty = !mine.cash && !mine.tiles.length && !mine.items.length && !theirs.cash && !theirs.tiles.length && !theirs.items.length;

  return (
    <Modal title="🤝 Jual-Beli Antarpemain" onClose={onClose} className="modal-wide">
      <div className="row-wrap">
        <span>Dengan:</span>
        {others.map((p) => (
          <button
            key={p.id}
            className={`chip chip-btn ${p.id === partnerId ? 'chip-on' : ''}`}
            style={{ borderColor: p.color }}
            onClick={() => {
              setPartnerId(p.id);
              setTheirs(empty());
              setAgreed(false);
            }}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="trade-cols">
        <OfferEditor game={game} player={me} offer={mine} onChange={(o) => (setMine(o), setAgreed(false))} />
        <div className="trade-swap" aria-hidden>
          ⇄
        </div>
        <OfferEditor game={game} player={partner} offer={theirs} onChange={(o) => (setTheirs(o), setAgreed(false))} />
      </div>
      <p className="hint">Properti yang grup warnanya masih ada bangunan tidak bisa diperdagangkan. Properti tergadai pindah tangan tetap dalam status gadai.</p>
      <label className="check">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        {me.name} dan {partner.name} sudah sepakat
      </label>
      <div className="prompt-actions">
        <button className="btn btn-primary" disabled={!agreed || isEmpty} onClick={submit}>
          Deal!
        </button>
      </div>
    </Modal>
  );
}

function OfferEditor({ game, player, offer, onChange }: { game: GameState; player: Player; offer: TradeOffer; onChange: (o: TradeOffer) => void }) {
  const tiles = ownedTiles(game, player.id);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="offer" style={{ borderColor: player.color }}>
      <h3>{player.name} memberi:</h3>
      <label className="num-field">
        Uang (jt)
        <input
          type="number"
          min={0}
          max={player.cash}
          value={offer.cash || ''}
          placeholder="0"
          onChange={(e) => onChange({ ...offer, cash: Math.max(0, Math.min(player.cash, Math.floor(+e.target.value || 0))) })}
        />
      </label>
      <span className="small muted">punya {rp(player.cash)}</span>
      <div className="offer-list">
        {tiles.length === 0 && <span className="small muted">Tidak ada properti.</span>}
        {tiles.map((i) => (
          <label key={i} className={`check ${canTradeTile(game, player.id, i) ? '' : 'disabled'}`}>
            <input
              type="checkbox"
              disabled={!canTradeTile(game, player.id, i)}
              checked={offer.tiles.includes(i)}
              onChange={() => onChange({ ...offer, tiles: toggle(offer.tiles, i) })}
            />
            {TILES[i].icon} {TILES[i].short}
            {game.board[i].mortgaged ? ' (gadai)' : ''}
          </label>
        ))}
        {player.items.map((it) => (
          <label key={it.cardId} className="check">
            <input type="checkbox" checked={offer.items.includes(it.cardId)} onChange={() => onChange({ ...offer, items: toggle(offer.items, it.cardId) })} />
            🎴 {ITEM_LABEL[it.kind]} <span className="small muted">({CARD_BY_ID[it.cardId].id})</span>
          </label>
        ))}
      </div>
    </div>
  );
}
