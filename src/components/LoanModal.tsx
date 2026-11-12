import { useState } from 'react';
import type { Dispatch } from '../App.tsx';
import { CONFIG } from '../engine/data.ts';
import { currentPlayer, getPlayer, loanDue, loanPenaltyDue } from '../engine/engine.ts';
import { rp } from '../engine/format.ts';
import type { GameState } from '../engine/types.ts';
import Modal from './Modal.tsx';

export default function LoanModal({ game, dispatch, onClose }: { game: GameState; dispatch: Dispatch; onClose: () => void }) {
  const me = currentPlayer(game);
  const others = game.players.filter((p) => !p.bankrupt && p.id !== me.id);
  const [dir, setDir] = useState<'borrow' | 'lend'>('borrow');
  const [otherId, setOtherId] = useState(others[0]?.id ?? '');
  const [amount, setAmount] = useState(100);
  const [interest, setInterest] = useState(CONFIG.loan.maxInterestPct);
  const [agreed, setAgreed] = useState(false);
  const lender = dir === 'borrow' ? otherId : me.id;
  const borrower = dir === 'borrow' ? me.id : otherId;
  const lenderP = lender ? getPlayer(game, lender) : null;
  const myLoans = game.loans.filter((l) => l.borrower === me.id || l.lender === me.id);

  const submit = () => {
    if (dispatch({ type: 'LOAN', lender, borrower, principal: amount, interestPct: interest })) {
      setAgreed(false);
      onClose();
    }
  };

  return (
    <Modal title="💸 Utang ke Tetangga" onClose={onClose}>
      {myLoans.length > 0 && (
        <div className="loan-list">
          <h3>Utang-piutang {me.name}</h3>
          {myLoans.map((l) => {
            const due = loanDue(l.principal, l.interestPct);
            const isBorrower = l.borrower === me.id;
            return (
              <div key={l.id} className="loan-row">
                <span>
                  {isBorrower ? `Utang ke ${getPlayer(game, l.lender).name}` : `Piutang dari ${getPlayer(game, l.borrower).name}`}: <strong>{rp(due)}</strong>
                  <span className="small muted"> · jatuh tempo putaran {l.dueRound}</span>
                </span>
                {isBorrower && (
                  <button className="btn btn-sm" disabled={me.cash < due} onClick={() => dispatch({ type: 'REPAY_LOAN', loanId: l.id })}>
                    Lunasi
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <h3>Buat pinjaman baru</h3>
      <div className="seg">
        <button className={dir === 'borrow' ? 'on' : ''} onClick={() => setDir('borrow')}>
          {me.name} meminjam
        </button>
        <button className={dir === 'lend' ? 'on' : ''} onClick={() => setDir('lend')}>
          {me.name} meminjamkan
        </button>
      </div>
      <div className="row-wrap">
        <span>{dir === 'borrow' ? 'Dari:' : 'Ke:'}</span>
        {others.map((p) => (
          <button key={p.id} className={`chip chip-btn ${p.id === otherId ? 'chip-on' : ''}`} style={{ borderColor: p.color }} onClick={() => setOtherId(p.id)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="row-wrap">
        <label className="num-field">
          Jumlah (jt)
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(Math.max(1, Math.floor(+e.target.value || 1)))} />
        </label>
        <label className="num-field">
          Bunga (%)
          <input
            type="number"
            min={0}
            max={CONFIG.loan.maxInterestPct}
            value={interest}
            onChange={(e) => setInterest(Math.max(0, Math.min(CONFIG.loan.maxInterestPct, Math.floor(+e.target.value || 0))))}
          />
        </label>
      </div>
      <p className="small">
        Total dikembalikan: <strong>{rp(loanDue(amount, interest))}</strong> dalam {CONFIG.loan.dueRounds} putaran. Jika telat: ditagih di grup chat RT,
        wajib bayar {rp(loanPenaltyDue(amount, interest))} (denda {CONFIG.loan.penaltyPct}%), atau serahkan properti senilai utang.
      </p>
      {lenderP && lenderP.cash < amount && <p className="banner-warn">Uang {lenderP.name} tidak cukup.</p>}
      <label className="check">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        Pemberi pinjaman ({lenderP?.name}) setuju
      </label>
      <div className="prompt-actions">
        <button className="btn btn-primary" disabled={!agreed || !otherId} onClick={submit}>
          Catat pinjaman
        </button>
      </div>
    </Modal>
  );
}
