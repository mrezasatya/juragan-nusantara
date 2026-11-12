import { useEffect, useState } from 'react';
import type { Dispatch } from '../App.tsx';
import { canEndTurn, canRoll, currentPlayer } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import Board from './Board.tsx';
import CenterPanel from './CenterPanel.tsx';
import PromptModal from './PromptModal.tsx';
import PlayersPanel from './PlayersPanel.tsx';
import LogPanel from './LogPanel.tsx';
import TileDetail from './TileDetail.tsx';
import ManageModal from './ManageModal.tsx';
import TradeModal from './TradeModal.tsx';
import LoanModal from './LoanModal.tsx';
import GameOver from './GameOver.tsx';
import Modal from './Modal.tsx';
import { DicePicker } from './DicePicker.tsx';
import { ITEM_LABEL } from '../ui/constants.ts';
import { CONFIG } from '../engine/data.ts';
import { cryptoDie } from '../ui/storage.ts';

interface Props {
  game: GameState;
  dispatch: Dispatch;
  onRules: () => void;
  onHome: () => void;
  onNewGame: () => void;
}

type Panel = null | 'manage' | 'trade' | 'loan' | 'menu';

export default function Game({ game, dispatch, onRules, onHome, onNewGame }: Props) {
  const [animating, setAnimating] = useState(false);
  const [tileInfo, setTileInfo] = useState<number | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [rolling, setRolling] = useState(false);
  const [pickDice, setPickDice] = useState(false);
  const [tab, setTab] = useState<'players' | 'log'>('players');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const me = currentPlayer(game);
  const now = useNow(game.kilat?.endsAt ? 1000 : null);

  const busy = animating || rolling;
  const physical = game.diceMode === 'fisik';

  const roll = () => {
    if (!canRoll(game) || busy) return;
    if (physical) return setPickDice(true);
    setRolling(true);
    setTimeout(() => {
      setRolling(false);
      dispatch({ type: 'ROLL', dice: [cryptoDie(), cryptoDie()] });
    }, 650);
  };

  const endTurn = () => dispatch({ type: 'END_TURN', now: Date.now() });

  // Tutup panel kelola saat situasi berubah ke keputusan yang tidak membolehkannya.
  useEffect(() => {
    if (game.prompt && game.prompt.type !== 'debt' && game.prompt.type !== 'buy' && panel === 'manage') setPanel(null);
  }, [game.prompt, panel]);

  const timeLeft = game.kilat?.endsAt ? Math.max(0, game.kilat.endsAt - now) : null;
  const canManage = !busy && (!game.prompt || game.prompt.type === 'debt' || game.prompt.type === 'buy') && game.phase !== 'resolving';
  const outsideTurnFlow = !game.prompt && (game.phase === 'preRoll' || game.phase === 'postRoll');

  return (
    <div className="game">
      <header className="topbar">
        <button className="btn btn-ghost btn-sm" onClick={() => setPanel('menu')} aria-label="Menu">
          ☰
        </button>
        <div className="topbar-turn">
          <span className="dot" style={{ background: me.color }} />
          <strong>{me.name}</strong>
          <span className="muted">· {rp(me.cash)}</span>
        </div>
        <div className="topbar-round">
          {game.mode === 'kilat' ? '⚡' : '🏠'} <span className="lbl">Putaran </span>
          {game.round}
          {game.kilat?.maxRounds ? `/${game.kilat.maxRounds}` : ''}
          {timeLeft !== null && <span className={timeLeft === 0 ? 'time-up' : ''}> · ⏱ {fmtTime(timeLeft)}</span>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRules} aria-label="Cara main">
          ?
        </button>
      </header>

      <div className="game-main">
        <div className="board-wrap">
          <Board game={game} onTileClick={setTileInfo} onAnimating={setAnimating} highlight={me.position}>
            <CenterPanel game={game} rolling={rolling} />
          </Board>
        </div>

        <aside className="side">
          <section className="action-bar" aria-live="polite">
            <TurnActions
              game={game}
              busy={busy}
              onRoll={roll}
              onEnd={endTurn}
              dispatch={dispatch}
              physical={physical}
            />
            <div className="action-secondary">
              <button className="btn btn-sm" disabled={!canManage} onClick={() => setPanel('manage')}>
                🏗️ Kelola Aset
              </button>
              <button className="btn btn-sm" disabled={!outsideTurnFlow || busy} onClick={() => setPanel('trade')}>
                🤝 Jual-Beli
              </button>
              <button className="btn btn-sm" disabled={!outsideTurnFlow || busy} onClick={() => setPanel('loan')}>
                💸 Utang
              </button>
            </div>
            {timeLeft === 0 && game.phase !== 'gameOver' && (
              <p className="banner-warn">⏱ Waktu habis! Permainan berakhir saat giliran ini selesai.</p>
            )}
          </section>

          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'players'} className={tab === 'players' ? 'on' : ''} onClick={() => setTab('players')}>
              Pemain
            </button>
            <button role="tab" aria-selected={tab === 'log'} className={tab === 'log' ? 'on' : ''} onClick={() => setTab('log')}>
              Kejadian
            </button>
          </div>
          <div className="tab-body">
            {tab === 'players' ? <PlayersPanel game={game} onTile={setTileInfo} /> : <LogPanel game={game} />}
          </div>
        </aside>
      </div>

      {!busy && game.prompt && game.phase !== 'gameOver' && panel !== 'manage' && (
        <PromptModal game={game} dispatch={dispatch} onManage={() => setPanel('manage')} onTile={setTileInfo} />
      )}
      {tileInfo !== null && <TileDetail game={game} index={tileInfo} onClose={() => setTileInfo(null)} />}
      {panel === 'manage' && <ManageModal game={game} dispatch={dispatch} onClose={() => setPanel(null)} />}
      {panel === 'trade' && <TradeModal game={game} dispatch={dispatch} onClose={() => setPanel(null)} />}
      {panel === 'loan' && <LoanModal game={game} dispatch={dispatch} onClose={() => setPanel(null)} />}
      {pickDice && (
        <Modal title="Masukkan angka dadu fisik" onClose={() => setPickDice(false)}>
          <DicePicker
            count={2}
            onDone={(d) => {
              setPickDice(false);
              dispatch({ type: 'ROLL', dice: [d[0], d[1]] });
            }}
          />
        </Modal>
      )}
      {panel === 'menu' && (
        <Modal title="Menu" onClose={() => setPanel(null)}>
          <div className="menu-list">
            <button className="btn" onClick={onRules}>
              📖 Cara Main
            </button>
            <button className="btn" onClick={onHome}>
              🏠 Ke Beranda (permainan tersimpan)
            </button>
            <button className="btn btn-danger" onClick={() => setConfirmEnd(true)}>
              🏁 Akhiri permainan &amp; hitung aset
            </button>
          </div>
          {confirmEnd && (
            <div className="confirm">
              <p>Akhiri permainan sekarang? Pemenang ditentukan dari total aset.</p>
              <button
                className="btn btn-danger"
                onClick={() => {
                  dispatch({ type: 'FINISH_GAME', reason: 'diakhiri oleh pemain' });
                  setConfirmEnd(false);
                  setPanel(null);
                }}
              >
                Ya, akhiri
              </button>
              <button className="btn" onClick={() => setConfirmEnd(false)}>
                Batal
              </button>
            </div>
          )}
        </Modal>
      )}
      {game.phase === 'gameOver' && !busy && <GameOver game={game} onHome={onHome} onNewGame={onNewGame} />}
      {/* Pastikan tombol akhiri giliran terjangkau keyboard */}
      <span className="sr-only">{canEndTurn(game) ? 'Giliran bisa diakhiri' : ''}</span>
    </div>
  );
}

function TurnActions({
  game,
  busy,
  onRoll,
  onEnd,
  dispatch,
  physical,
}: {
  game: GameState;
  busy: boolean;
  onRoll: () => void;
  onEnd: () => void;
  dispatch: Dispatch;
  physical: boolean;
}) {
  const me = currentPlayer(game);
  if (game.phase === 'gameOver') return <p className="muted">Permainan selesai.</p>;
  if (busy) return <p className="muted">Pion sedang berjalan…</p>;
  if (game.prompt) return <p className="muted">Menunggu keputusan…</p>;

  if (game.phase === 'preRoll' && me.inJail) {
    const jailItems = me.items.filter((i) => i.kind === 'jail_free' || i.kind === 'orang_dalam');
    return (
      <div className="turn-actions">
        <p className="turn-note">
          🛋️ <strong>{me.name}</strong> sedang di Hotel Prodeo (percobaan dobel {me.jailAttempts}/{CONFIG.jail.maxAttempts}).
        </p>
        <button className="btn btn-primary btn-lg" onClick={onRoll}>
          🎲 Lempar, cari dobel
        </button>
        <div className="row-wrap">
          <button className="btn" disabled={me.cash < CONFIG.jail.fine} onClick={() => dispatch({ type: 'JAIL_PAY' })}>
            Bayar denda {rp(CONFIG.jail.fine)}
          </button>
          {jailItems.map((it) => (
            <button key={it.cardId} className="btn" onClick={() => dispatch({ type: 'JAIL_USE_ITEM', item: it.kind as 'jail_free' | 'orang_dalam' })}>
              Pakai {ITEM_LABEL[it.kind]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (canRoll(game)) {
    return (
      <div className="turn-actions">
        {game.phase === 'postRoll' && <p className="turn-note">🎉 Dobel! {me.name} lempar lagi.</p>}
        <button className="btn btn-primary btn-lg btn-roll" onClick={onRoll}>
          🎲 {physical ? 'Masukkan Dadu' : 'Lempar Dadu'}
        </button>
        {game.phase === 'preRoll' && <p className="hint">Sebelum melempar, kamu boleh bangun, gadai, atau jual-beli.</p>}
      </div>
    );
  }

  if (canEndTurn(game)) {
    return (
      <div className="turn-actions">
        <button className="btn btn-primary btn-lg" onClick={onEnd}>
          ✅ Selesai Giliran
        </button>
        <p className="hint">Masih boleh bangun, gadai, atau jual-beli sebelum selesai.</p>
      </div>
    );
  }
  return null;
}

function useNow(interval: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!interval) return;
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

function fmtTime(ms: number) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
