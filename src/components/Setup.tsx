import { useState } from 'react';
import { CONFIG } from '../engine/data.ts';
import type { NewGameOptions } from '../engine/engine.ts';
import type { DiceMode, GameMode, GameRules } from '../engine/types.ts';
import { DEFAULT_NAMES, PLAYER_COLORS, TOKENS, normalizeToken, tokenInfo } from '../ui/constants.ts';
import Avatar from './Avatar.tsx';
import { loadSetup, saveSetup } from '../ui/storage.ts';

interface Props {
  onBack: () => void;
  onStart: (o: Omit<NewGameOptions, 'seed' | 'now'>) => void;
}

interface SetupState {
  count: number;
  names: string[];
  tokens: string[];
  mode: GameMode;
  diceMode: DiceMode;
  limitType: 'rounds' | 'minutes';
  rounds: number;
  minutes: number;
  rules: GameRules;
}

const DEFAULT: SetupState = {
  count: 4,
  names: ['', '', '', '', '', ''],
  tokens: TOKENS.slice(0, 6).map((t) => t.id),
  mode: 'klasik',
  diceMode: 'digital',
  limitType: 'rounds',
  rounds: CONFIG.kilat.defaultRounds,
  minutes: CONFIG.kilat.defaultMinutes,
  rules: { visitUpgrade: true, bonusCards: true, roundEvents: true },
};

export default function Setup({ onBack, onStart }: Props) {
  // Nama, pion, dan mode diingat; mode dadu TIDAK diingat, selalu mulai dari acak otomatis.
  const [st, setSt] = useState<SetupState>(() => {
    const saved = loadSetup<SetupState>() ?? {};
    const merged = { ...DEFAULT, ...saved, diceMode: 'digital' as const, rules: { ...DEFAULT.rules, ...((saved as Partial<SetupState>).rules ?? {}) } };
    // Nama contoh versi lama tidak diisi otomatis lagi; pemain menulis nama sendiri.
    merged.names = Array.from({ length: 6 }, (_, i) => {
      const n = (merged.names ?? [])[i] ?? '';
      return DEFAULT_NAMES.includes(n) ? '' : n;
    });
    // Pion versi lama dipetakan ke karakter baru; pastikan tidak ada pion kembar.
    const seen = new Set<string>();
    merged.tokens = merged.tokens.map((t, i) => {
      let id: string = normalizeToken(t);
      if (seen.has(id)) id = TOKENS.find((x) => !seen.has(x.id))?.id ?? TOKENS[i % TOKENS.length].id;
      seen.add(id);
      return id;
    });
    while (merged.tokens.length < 6) merged.tokens.push(TOKENS.find((x) => !merged.tokens.includes(x.id))!.id);
    return merged;
  });
  const set = (patch: Partial<SetupState>) => setSt((s) => ({ ...s, ...patch }));

  const setName = (i: number, v: string) => set({ names: st.names.map((n, j) => (j === i ? v : n)) });
  const setToken = (i: number, id: string) => {
    // Tukar pion jika sudah dipakai pemain lain.
    const tokens = [...st.tokens];
    const other = tokens.indexOf(id);
    if (other >= 0 && other !== i) tokens[other] = tokens[i];
    tokens[i] = id;
    set({ tokens });
  };

  const start = () => {
    saveSetup(st);
    onStart({
      players: Array.from({ length: st.count }, (_, i) => ({
        // Nama kosong → pakai nama karakter pion (mis. "Mas Ojol").
        name: st.names[i]?.trim() || tokenInfo(st.tokens[i]).label,
        token: st.tokens[i],
        color: PLAYER_COLORS[i],
      })),
      mode: st.mode,
      diceMode: st.diceMode,
      rules: st.rules,
      kilatRounds: st.mode === 'kilat' && st.limitType === 'rounds' ? st.rounds : null,
      kilatMinutes: st.mode === 'kilat' && st.limitType === 'minutes' ? st.minutes : null,
    });
  };

  return (
    <main className="setup">
      <header className="setup-head">
        <button className="btn btn-ghost" onClick={onBack}>
          ← Kembali
        </button>
        <h1>Permainan Baru</h1>
      </header>

      <section className="setup-section">
        <h2>Jumlah pemain</h2>
        <div className="seg">
          {[2, 3, 4, 5, 6].map((n) => (
            <button key={n} className={st.count === n ? 'on' : ''} onClick={() => set({ count: n })}>
              {n}
            </button>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h2>Nama &amp; pion</h2>
        <div className="setup-players">
          {Array.from({ length: st.count }, (_, i) => (
            <div className="setup-player" key={i} style={{ borderColor: PLAYER_COLORS[i] }}>
              <span className="setup-dot" style={{ background: PLAYER_COLORS[i] }}>
                {i + 1}
              </span>
              <input
                aria-label={`Nama pemain ${i + 1}`}
                value={st.names[i] ?? ''}
                placeholder={`Nama pemain ${i + 1} (kosong = ${tokenInfo(st.tokens[i]).label})`}
                maxLength={16}
                onChange={(e) => setName(i, e.target.value)}
              />
              <div className="token-pick" role="radiogroup" aria-label={`Pion pemain ${i + 1}`}>
                {TOKENS.map((t) => (
                  <button
                    key={t.id}
                    title={t.label}
                    role="radio"
                    aria-checked={st.tokens[i] === t.id}
                    aria-label={t.label}
                    className={st.tokens[i] === t.id ? 'on' : ''}
                    style={st.tokens[i] === t.id ? { borderColor: PLAYER_COLORS[i] } : undefined}
                    onClick={() => setToken(i, t.id)}
                  >
                    <Avatar token={t.id} size={46} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h2>Mode permainan</h2>
        <div className="mode-cards">
          <button className={`mode-card ${st.mode === 'klasik' ? 'on' : ''}`} onClick={() => set({ mode: 'klasik' })}>
            <strong>🏠 Klasik</strong>
            <span>Aturan penuh. Menang jika semua lawan bangkrut. Sekitar 1,5–3 jam.</span>
          </button>
          <button className={`mode-card ${st.mode === 'kilat' ? 'on' : ''}`} onClick={() => set({ mode: 'kilat' })}>
            <strong>⚡ Kilat</strong>
            <span>Untuk ice breaking. Tiap pemain dapat 2 properti acak. Pemenang = total aset terbesar saat batas tercapai.</span>
          </button>
        </div>
        {st.mode === 'kilat' && (
          <div className="kilat-opts">
            <div className="seg">
              <button className={st.limitType === 'rounds' ? 'on' : ''} onClick={() => set({ limitType: 'rounds' })}>
                Batas putaran
              </button>
              <button className={st.limitType === 'minutes' ? 'on' : ''} onClick={() => set({ limitType: 'minutes' })}>
                Batas waktu
              </button>
            </div>
            {st.limitType === 'rounds' ? (
              <label className="num-field">
                <input type="number" min={3} max={60} value={st.rounds} onChange={(e) => set({ rounds: clamp(+e.target.value, 3, 60) })} />
                putaran
              </label>
            ) : (
              <label className="num-field">
                <input type="number" min={10} max={180} value={st.minutes} onChange={(e) => set({ minutes: clamp(+e.target.value, 10, 180) })} />
                menit
              </label>
            )}
            <p className="hint">
              {st.limitType === 'rounds'
                ? '1 putaran = setiap pemain mendapat 1 giliran.'
                : 'Permainan berakhir di akhir giliran saat waktu habis.'}
            </p>
          </div>
        )}
      </section>

      <section className="setup-section">
        <h2>Aturan Seru</h2>
        <p className="hint" style={{ marginTop: 0 }}>Tambahan supaya permainan tidak monoton. Matikan semua untuk aturan klasik.</p>
        <div className="rule-list">
          {(
            [
              ['visitUpgrade', '🏠 Renovasi saat singgah', `Berhenti di properti sendiri → boleh bangun +1 Homestay walau grup belum lengkap (maks. ${CONFIG.rules.visitUpgradeMaxLevelWithoutSet} Homestay; Resort tetap butuh grup lengkap).`],
              ['bonusCards', '🎴 Kartu bonus', 'Dadu dobel → ambil Kartu Nasib. Lewat MULAI → ambil Kartu Warga.'],
              ['roundEvents', '📰 Kabar Nusantara', 'Setiap awal putaran ada satu kejadian untuk semua pemain: rezeki atau sindiran.'],
            ] as const
          ).map(([key, title, desc]) => (
            <label key={key} className="rule-item">
              <input type="checkbox" checked={st.rules[key]} onChange={(e) => set({ rules: { ...st.rules, [key]: e.target.checked } })} />
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="setup-section">
        <h2>Dadu</h2>
        <div className="mode-cards">
          <button className={`mode-card ${st.diceMode === 'digital' ? 'on' : ''}`} onClick={() => set({ diceMode: 'digital' })}>
            <strong>🎲 Dadu acak otomatis</strong>
            <span>Tekan "Lempar Dadu", aplikasi mengacak angkanya secara adil. Pilihan yang disarankan.</span>
          </button>
          <button className={`mode-card ${st.diceMode === 'fisik' ? 'on' : ''}`} onClick={() => set({ diceMode: 'fisik' })}>
            <strong>✋ Pakai dadu sungguhan di meja</strong>
            <span>Hanya jika kamu punya dadu asli: lempar di meja, lalu ketik angkanya di aplikasi.</span>
          </button>
        </div>
      </section>

      <div className="setup-start">
        <button className="btn btn-primary btn-lg" onClick={start}>
          Mulai Main →
        </button>
      </div>
    </main>
  );
}

const clamp = (v: number, a: number, b: number) => (Number.isFinite(v) ? Math.min(b, Math.max(a, Math.round(v))) : a);
