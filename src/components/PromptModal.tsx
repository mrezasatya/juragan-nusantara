import { useState } from 'react';
import type { Dispatch } from '../App.tsx';
import { CARD_BY_ID, CONFIG, TILES, ownable } from '../engine/data.ts';
import { getPlayer, liquidationValue, ownedTiles, tileAssetValue, totalAssets } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { CardOption, Creditor, GameState } from '../engine/types.ts';
import { cryptoDie } from '../ui/storage.ts';
import CardView from './CardView.tsx';
import { DicePicker } from './DicePicker.tsx';
import Modal from './Modal.tsx';
import { PropertyCard } from './TileDetail.tsx';

interface Props {
  game: GameState;
  dispatch: Dispatch;
  onManage: () => void;
  onTile: (i: number) => void;
}

export default function PromptModal({ game, dispatch, onManage }: Props) {
  const pr = game.prompt!;
  const physical = game.diceMode === 'fisik';
  const [pick, setPick] = useState<null | ((d: number) => void)>(null);
  const roll1 = (fn: (d: number) => void) => (physical ? setPick(() => fn) : fn(cryptoDie()));

  if (pick)
    return (
      <Modal title="Masukkan angka 1 dadu fisik">
        <DicePicker
          count={1}
          onDone={(d) => {
            const f = pick;
            setPick(null);
            f(d[0]);
          }}
        />
      </Modal>
    );

  switch (pr.type) {
    case 'buy': {
      const p = getPlayer(game, pr.player);
      const t = ownable(pr.tile);
      const enough = p.cash >= t.price;
      return (
        <Modal title={`${p.name} berhenti di ${t.short}`} className="modal-prompt">
          <PropertyCard game={game} index={pr.tile} compact />
          <p className="prompt-line">
            Uangmu: <strong>{rp(p.cash)}</strong>
          </p>
          <div className="prompt-actions">
            <button className="btn btn-primary btn-lg" disabled={!enough} onClick={() => dispatch({ type: 'BUY' })}>
              Beli {rp(t.price)}
            </button>
            <button className="btn" onClick={() => dispatch({ type: 'DECLINE_BUY' })}>
              Tidak, lelang saja
            </button>
            {!enough && (
              <button className="btn btn-sm" onClick={onManage}>
                Uang kurang? Gadai / jual bangunan
              </button>
            )}
          </div>
        </Modal>
      );
    }

    case 'auction':
      return <AuctionModal game={game} dispatch={dispatch} />;

    case 'card': {
      const card = CARD_BY_ID[pr.cardId];
      const p = getPlayer(game, pr.player);
      const choose = (option: CardOption) => {
        if (option === 'roll') roll1((die) => dispatch({ type: 'CARD_CHOICE', option, die }));
        else dispatch({ type: 'CARD_CHOICE', option });
      };
      const eff = card.effect;
      const label: Record<CardOption, string> = {
        ok: card.effect.type === 'KEEP_ITEM' ? 'Simpan kartu' : 'OK, jalankan',
        skip: 'Diam 1 giliran',
        pay: eff.type === 'SKIP_OR_PAY' ? `Bayar ojek ${rp(eff.amount)}` : 'Bayar',
        shield: '🛡️ Pakai Asuransi Bencana',
        roll: physical ? '🎲 Masukkan dadu' : '🎲 Lempar 1 dadu',
      };
      return (
        <Modal title={`${p.name} mengambil kartu`} className="modal-prompt modal-card">
          <CardView card={card} />
          <div className="prompt-actions">
            {pr.options.map((o, i) => (
              <button
                key={o}
                className={`btn ${i === 0 ? 'btn-primary btn-lg' : ''}`}
                disabled={o === 'pay' && eff.type === 'SKIP_OR_PAY' && p.cash < eff.amount}
                onClick={() => choose(o)}
              >
                {o === 'ok' && pr.options.includes('shield') ? 'Tidak usah, terima efeknya' : label[o]}
              </button>
            ))}
          </div>
        </Modal>
      );
    }

    case 'incomeTax': {
      const p = getPlayer(game, pr.player);
      return (
        <Modal title="🧾 Pajak Penghasilan" className="modal-prompt">
          <p className="caption">"Hitung sendiri, lapor sendiri, bayar sendiri, ditegur juga sendiri."</p>
          <p>
            {p.name}, pilih cara bayar pajak. Total asetmu {rp(totalAssets(game, p.id))} (uang + properti + bangunan).
          </p>
          <div className="prompt-actions">
            <button className={`btn btn-lg ${pr.flat <= pr.percentAmount ? 'btn-primary' : ''}`} onClick={() => dispatch({ type: 'INCOME_TAX', choice: 'flat' })}>
              Bayar tetap {rp(pr.flat)}
            </button>
            <button className={`btn btn-lg ${pr.flat > pr.percentAmount ? 'btn-primary' : ''}`} onClick={() => dispatch({ type: 'INCOME_TAX', choice: 'percent' })}>
              Bayar 10% aset = {rp(pr.percentAmount)}
            </button>
          </div>
        </Modal>
      );
    }

    case 'pungli': {
      const p = getPlayer(game, pr.player);
      const hasOD = p.items.some((i) => i.kind === 'orang_dalam');
      const { low, mid } = CONFIG.pungli.nego;
      return (
        <Modal title="🪙 Pos Pungli" className="modal-prompt">
          <p className="caption">"Seikhlasnya, tapi ada tarifnya."</p>
          <div className="prompt-actions">
            <button className="btn btn-lg btn-primary" onClick={() => dispatch({ type: 'PUNGLI', choice: 'pay' })}>
              Bayar "uang rokok" {rp(CONFIG.pungli.flat)}
            </button>
            <button className="btn btn-lg" onClick={() => roll1((die) => dispatch({ type: 'PUNGLI', choice: 'nego', die }))}>
              🎲 Nego dulu
            </button>
            {hasOD && (
              <button className="btn btn-lg" onClick={() => dispatch({ type: 'PUNGLI', choice: 'orang_dalam' })}>
                🤫 Pakai Kartu Orang Dalam
              </button>
            )}
          </div>
          <table className="mini-table">
            <tbody>
              <tr>
                <td>🎲 1–2</td>
                <td>"Petugas tersinggung." Bayar {rp(low)}</td>
              </tr>
              <tr>
                <td>🎲 3–4</td>
                <td>"Ya sudah, tarif normal." Bayar {rp(mid)}</td>
              </tr>
              <tr>
                <td>🎲 5–6</td>
                <td>"Petugasnya lagi baik hati." Gratis</td>
              </tr>
            </tbody>
          </table>
          <p className="hint">Semua pungli masuk Kas Warkop.</p>
        </Modal>
      );
    }

    case 'freeBuilding':
      return (
        <Modal title="🏠 Gotong Royong Bedah Rumah" className="modal-prompt">
          <p>Pilih properti untuk 1 Homestay gratis:</p>
          <div className="prompt-actions">
            {pr.tiles.map((i) => (
              <button key={i} className="btn" onClick={() => dispatch({ type: 'FREE_BUILDING', tile: i })}>
                {TILES[i].icon} {TILES[i].short}
              </button>
            ))}
          </div>
        </Modal>
      );

    case 'debt':
      return <DebtModal game={game} dispatch={dispatch} onManage={onManage} />;

    case 'jailRoll':
      return null;
  }
}

function creditorLabel(game: GameState, c: Creditor) {
  if (c === 'bank') return 'Bank';
  if (c === 'warkop') return 'Kas Warkop';
  if (c === 'arisan') return 'Kas Arisan';
  return getPlayer(game, c.player).name;
}

function DebtModal({ game, dispatch, onManage }: { game: GameState; dispatch: Dispatch; onManage: () => void }) {
  const pr = game.prompt as Extract<GameState['prompt'], { type: 'debt' }>;
  const p = getPlayer(game, pr.player);
  const liq = liquidationValue(game, p.id);
  const canPay = p.cash >= pr.amount;
  const canRaise = liq >= pr.amount;
  return (
    <Modal title={`💸 ${p.name} kurang uang`} className="modal-prompt" accent="#B5442C">
      <p>
        Harus membayar <strong>{rp(pr.amount)}</strong> ke <strong>{creditorLabel(game, pr.to)}</strong> ({pr.reason}).
      </p>
      <p className="prompt-line">
        Uang sekarang: <strong>{rp(p.cash)}</strong> · Maksimal bisa dikumpulkan: <strong>{rp(liq)}</strong>
      </p>
      <div className="prompt-actions">
        {canPay ? (
          <button className="btn btn-primary btn-lg" onClick={() => dispatch({ type: 'PAY_DEBT' })}>
            Bayar {rp(pr.amount)}
          </button>
        ) : (
          <>
            <button className="btn" onClick={onManage}>
              🏗️ Pilih sendiri: jual bangunan / gadai
            </button>
            {canRaise && (
              <button className="btn btn-primary" onClick={() => dispatch({ type: 'AUTO_LIQUIDATE' })}>
                ⚡ Jual &amp; gadai otomatis secukupnya
              </button>
            )}
          </>
        )}
        {pr.allowSurrender &&
          !canPay &&
          ownedTiles(game, p.id).map((i) => (
            <button key={i} className="btn btn-sm" onClick={() => dispatch({ type: 'SURRENDER_PROPERTY', tile: i })}>
              Serahkan {TILES[i].short} (nilai {rp(tileAssetValue(game, i))})
            </button>
          ))}
        {!canRaise && (
          <button className="btn btn-danger" onClick={() => dispatch({ type: 'DECLARE_BANKRUPTCY' })}>
            💥 Nyatakan bangkrut
          </button>
        )}
      </div>
      {!canRaise && <p className="hint">Semua aset diserahkan ke {creditorLabel(game, pr.to)}.</p>}
    </Modal>
  );
}

function AuctionModal({ game, dispatch }: { game: GameState; dispatch: Dispatch }) {
  const pr = game.prompt as Extract<GameState['prompt'], { type: 'auction' }>;
  const t = ownable(pr.tile);
  const bidder = getPlayer(game, pr.bidders[pr.turn]);
  const min = Math.max(CONFIG.auction.startBid, pr.highBid + 1);
  const [custom, setCustom] = useState('');
  const quick = Array.from(new Set([min, pr.highBid + 10, pr.highBid + 50, pr.highBid + 100].filter((v) => v >= min))).slice(0, 4);
  const bid = (amount: number) => {
    if (dispatch({ type: 'BID', player: bidder.id, amount })) setCustom('');
  };
  return (
    <Modal title="🔨 Lelang Pasar Tradisional" className="modal-prompt">
      <p>
        {t.icon} <strong>{t.name}</strong> · harga normal {rp(t.price)}
      </p>
      <div className="auction-status">
        <div>
          Tawaran tertinggi
          <strong>{pr.highBidder ? `${rp(pr.highBid)} — ${getPlayer(game, pr.highBidder).name}` : 'belum ada'}</strong>
        </div>
        <div className="auction-bidders">
          {pr.bidders.map((id, k) => {
            const pl = getPlayer(game, id);
            return (
              <span key={id} className={`chip ${k === pr.turn ? 'chip-on' : ''}`} style={{ borderColor: pl.color }}>
                {pl.name}
              </span>
            );
          })}
        </div>
      </div>
      <p className="auction-turn" style={{ borderColor: bidder.color }}>
        Giliran menawar: <strong>{bidder.name}</strong> (uang {rp(bidder.cash)})
      </p>
      <div className="prompt-actions">
        <div className="row-wrap">
          {quick.map((v) => (
            <button key={v} className="btn" disabled={bidder.cash < v} onClick={() => bid(v)}>
              Tawar {rp(v)}
            </button>
          ))}
        </div>
        <div className="row-wrap">
          <input
            className="input"
            inputMode="numeric"
            placeholder={`min ${min} (jt)`}
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
            aria-label="Tawaran lain dalam juta"
          />
          <button className="btn" disabled={!custom || +custom < min || +custom > bidder.cash} onClick={() => bid(+custom)}>
            Tawar
          </button>
        </div>
        <button className="btn btn-ghost" onClick={() => dispatch({ type: 'PASS_BID', player: bidder.id })}>
          Mundur dari lelang
        </button>
      </div>
      <p className="hint">Lelang berakhir jika tinggal satu penawar. Pemain bergantian memegang perangkat.</p>
    </Modal>
  );
}
