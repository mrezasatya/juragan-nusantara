import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
import { cryptoDie, loadView, saveView, supportsWebGL, type ViewMode } from '../ui/storage.ts';
import type { DiceRoll } from '../three/Dice3D.tsx';
import { diffEvents, stamp, type FxEvent } from '../ui/gameEvents.ts';
import { isMuted, setMuted, sfx, unlockAudio } from '../ui/sfx.ts';

const Board3D = lazy(() => import('../three/Board3D.tsx'));

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

  const [view, setView] = useState<ViewMode>(() => loadView());
  const [diceRoll, setDiceRoll] = useState<DiceRoll | null>(null);
  const pendingRoll = useRef<{ id: number; values: [number, number]; timer: number } | null>(null);
  const busy = animating || rolling;
  const physical = game.diceMode === 'fisik';
  const is3d = view === '3d';

  // ===== Efek (suara & visual) yang ditahan sampai pion selesai berjalan =====
  const [fx, setFx] = useState<FxEvent[]>([]);
  const [muted, setMutedState] = useState(isMuted());
  const [animDoneSeq, setAnimDoneSeq] = useState(game.moveSeq);
  const latestMoveSeq = useRef(game.moveSeq);
  latestMoveSeq.current = game.moveSeq;
  const prevGame = useRef(game);
  const pendingFx = useRef<ReturnType<typeof diffEvents>>([]);
  const onAnimating = useCallback((b: boolean) => {
    setAnimating(b);
    if (!b) setAnimDoneSeq(latestMoveSeq.current);
  }, []);
  useEffect(() => {
    if (prevGame.current === game) return;
    pendingFx.current.push(...diffEvents(prevGame.current, game));
    prevGame.current = game;
  }, [game]);
  const settled = !animating && !rolling && game.moveSeq === animDoneSeq;
  useEffect(() => {
    if (!settled || !pendingFx.current.length) return;
    const evs = stamp(pendingFx.current.splice(0));
    setFx((f) => [...f, ...evs].slice(-40));
    playSounds(evs);
  }, [settled, game]);
  // Pengaman: jika animasi tidak melapor (mis. papan 3D masih dimuat), jangan tahan efek selamanya.
  useEffect(() => {
    if (animating || game.moveSeq === animDoneSeq) return;
    const t = setTimeout(() => setAnimDoneSeq(latestMoveSeq.current), 4000);
    return () => clearTimeout(t);
  }, [animating, game.moveSeq, animDoneSeq]);
  useEffect(() => {
    if (!fx.length) return;
    const t = setTimeout(() => setFx((f) => f.filter((e) => performance.now() - e.at < 3000)), 3100);
    return () => clearTimeout(t);
  }, [fx]);
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);
  const toggleMute = () => {
    setMuted(!muted);
    setMutedState(!muted);
  };

  const switchView = (v: ViewMode) => {
    setView(v);
    saveView(v);
    setAnimDoneSeq(game.moveSeq);
  };

  /** Selesaikan lemparan: kirim angka dadu ke engine (dipanggil setelah animasi dadu mendarat). */
  const finishRoll = useCallback(
    (id: number) => {
      const p = pendingRoll.current;
      if (!p || p.id !== id) return;
      window.clearTimeout(p.timer);
      pendingRoll.current = null;
      setRolling(false);
      dispatch({ type: 'ROLL', dice: p.values });
    },
    [dispatch],
  );

  const throwDice = (values: [number, number]) => {
    unlockAudio();
    sfx.dice();
    if (!is3d) {
      setRolling(true);
      setTimeout(() => {
        setRolling(false);
        dispatch({ type: 'ROLL', dice: values });
      }, 650);
      return;
    }
    const id = Date.now();
    // Pengaman: jika animasi 3D tidak melapor (mis. tab tidak aktif), tetap lanjut.
    const timer = window.setTimeout(() => finishRoll(id), 3500);
    pendingRoll.current = { id, values, timer };
    setRolling(true);
    setDiceRoll({ id, values });
  };

  const roll = () => {
    if (!canRoll(game) || busy) return;
    if (physical) return setPickDice(true);
    throwDice([cryptoDie(), cryptoDie()]);
  };

  const endTurn = () => dispatch({ type: 'END_TURN', now: Date.now() });

  // Tutup panel kelola saat situasi berubah ke keputusan yang tidak membolehkannya.
  useEffect(() => {
    if (game.prompt && game.prompt.type !== 'debt' && game.prompt.type !== 'buy' && panel === 'manage') setPanel(null);
  }, [game.prompt, panel]);

  const timeLeft = game.kilat?.endsAt ? Math.max(0, game.kilat.endsAt - now) : null;
  const canManage =
    !busy && game.phase !== 'gameOver' && (!game.prompt || game.prompt.type === 'debt' || game.prompt.type === 'buy') && game.phase !== 'resolving';
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
        <button className="btn btn-ghost btn-sm" onClick={toggleMute} aria-label={muted ? 'Nyalakan suara' : 'Matikan suara'} title={muted ? 'Nyalakan suara' : 'Matikan suara'}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onRules} aria-label="Cara main">
          ?
        </button>
      </header>

      <div className="game-main">
        <div className={`board-wrap ${is3d ? 'board-wrap-3d' : ''}`}>
          {is3d ? (
            <Suspense fallback={<div className="board3d board3d-loading">Menyiapkan papan 3D…</div>}>
              <Board3D
                game={game}
                onTileClick={setTileInfo}
                onAnimating={onAnimating}
                fx={fx}
                diceRoll={diceRoll}
                rolling={rolling}
                onDiceDone={(r) => finishRoll(r.id)}
                onSwitch2D={() => switchView('2d')}
              />
            </Suspense>
          ) : (
            <Board game={game} onTileClick={setTileInfo} onAnimating={onAnimating} highlight={me.position}>
              <CenterPanel game={game} rolling={rolling} />
            </Board>
          )}
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
              throwDice([d[0], d[1]]);
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
            {is3d ? (
              <button className="btn" onClick={() => (switchView('2d'), setPanel(null))}>
                🗺️ Ganti ke tampilan 2D (ringan)
              </button>
            ) : (
              <button className="btn" disabled={!supportsWebGL()} onClick={() => (switchView('3d'), setPanel(null))}>
                🎮 Ganti ke tampilan 3D{supportsWebGL() ? '' : ' (tidak didukung perangkat ini)'}
              </button>
            )}
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

/** Satu suara per jenis kejadian per kelompok, diberi jeda supaya tidak menumpuk. */
function playSounds(evs: FxEvent[]) {
  const kinds = new Set<string>(evs.map((e) => (e.kind === 'money' ? (e.amount > 0 ? 'gain' : 'loss') : e.kind)));
  const order: [string, () => void][] = [
    ['win', sfx.win],
    ['bankrupt', sfx.bankrupt],
    ['jail', sfx.jail],
    ['buy', sfx.buy],
    ['build', sfx.build],
    ['card', sfx.card],
    ['gain', sfx.coin],
    ['loss', sfx.pay],
    ['turn', sfx.turn],
  ];
  let delay = 0;
  for (const [k, play] of order) {
    if (!kinds.has(k)) continue;
    if (k === 'loss' && (kinds.has('buy') || kinds.has('build'))) continue;
    if (k === 'turn' && kinds.size > 1) continue;
    setTimeout(play, delay);
    delay += 220;
  }
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
