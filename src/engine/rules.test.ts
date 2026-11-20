import { createGame, GameError, reduce, moneyBalance, RULES_ON, canVisitUpgrade } from './engine.ts';
import { CONFIG, EVENTS } from './data.ts';
import { act, cash, own, pl, setup, stackDeck } from './testUtils.ts';
import type { GameState } from './types.ts';

const seru = (n = 4, rules = RULES_ON): GameState =>
  createGame({
    players: Array.from({ length: n }, (_, i) => ({ name: `P${i + 1}`, token: 'ojol', color: '#000' })),
    mode: 'klasik',
    seed: 7,
    rules,
  });

describe('Konten Kabar Nusantara (events.json)', () => {
  it('16 kabar, 8 kebaikan & 8 sindiran, ID unik, nominal cocok dengan teks', () => {
    expect(EVENTS).toHaveLength(16);
    expect(EVENTS.filter((e) => e.side === 'kebaikan')).toHaveLength(8);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(16);
    for (const e of EVENTS) {
      const json = JSON.stringify(e.effect);
      for (const m of e.effectText.matchAll(/Rp (\d+) jt/g)) expect(json, e.id).toMatch(new RegExp(`:${m[1]}[,}]`));
    }
  });
});

describe('Aturan klasik tetap bawaan engine', () => {
  it('tanpa opsi, semua Aturan Seru mati', () => {
    const s = createGame({ players: [{ name: 'a', token: 'ojol', color: '#000' }, { name: 'b', token: 'kos', color: '#111' }], mode: 'klasik', seed: 1 });
    expect(s.rules).toEqual({ visitUpgrade: false, bonusCards: false, roundEvents: false });
  });
  it('singgah di properti sendiri tanpa Aturan Seru: tidak ada tawaran renovasi', () => {
    let s = own(seru(4, { visitUpgrade: false, bonusCards: false, roundEvents: false }), 'p1', [5, 8]);
    s = act(s, { type: 'ROLL', dice: [3, 5] }); // ke petak 8 (milik sendiri)
    expect(s.prompt).toBeNull();
  });
});

describe('🏠 Renovasi saat singgah', () => {
  it('berhenti di properti sendiri → ditawari +1 Homestay; terima = bayar biaya bangun', () => {
    let s = own(seru(), 'p1', [8]);
    s = act(s, { type: 'ROLL', dice: [3, 5] });
    expect(s.prompt).toMatchObject({ type: 'upgrade', tile: 8, cost: 50, level: 1 });
    s = act(s, { type: 'UPGRADE', accept: true });
    expect(s.board[8].level).toBe(1);
    expect(cash(s, 'p1')).toBe(1450);
    expect(moneyBalance(s)).toBe(0);
  });

  it('boleh menolak', () => {
    let s = own(seru(), 'p1', [8]);
    s = act(s, { type: 'ROLL', dice: [3, 5] }, { type: 'UPGRADE', accept: false });
    expect(s.board[8].level).toBe(0);
    expect(s.prompt).toBeNull();
  });

  it(`tanpa grup lengkap dibatasi ${CONFIG.rules.visitUpgradeMaxLevelWithoutSet} Homestay; Resort butuh grup lengkap`, () => {
    const cap = CONFIG.rules.visitUpgradeMaxLevelWithoutSet;
    let s = own(seru(), 'p1', [8], cap);
    expect(canVisitUpgrade(s, 'p1', 8)).toBe(false);
    s = act(s, { type: 'ROLL', dice: [3, 5] });
    expect(s.prompt).toBeNull();
    s = own(seru(), 'p1', [6, 8, 9], 4);
    expect(canVisitUpgrade(s, 'p1', 8)).toBe(true); // grup lengkap → boleh naik ke Resort
  });

  it('tidak ditawarkan untuk properti tergadai, transportasi, atau jika uang kurang', () => {
    let s = own(seru(), 'p1', [8, 5]);
    s = setup(s, (d) => (d.board[8].mortgaged = true));
    expect(canVisitUpgrade(s, 'p1', 8)).toBe(false);
    expect(canVisitUpgrade(s, 'p1', 5)).toBe(false);
    s = setup(own(seru(), 'p1', [39]), (d) => (d.players[0].cash = 100));
    expect(canVisitUpgrade(s, 'p1', 39)).toBe(false);
  });

  it('menerima saat tidak memenuhi syarat ditolak engine', () => {
    let s = own(seru(), 'p1', [8]);
    s = act(s, { type: 'ROLL', dice: [3, 5] });
    s = setup(s, (d) => (d.players[0].cash = 10));
    expect(() => reduce(s, { type: 'UPGRADE', accept: true })).toThrow(GameError);
  });
});

describe('🎴 Kartu bonus', () => {
  it('dadu dobel → ambil Kartu Nasib setelah aksi petak', () => {
    let s = stackDeck(seru(), 'nasib', ['N01']);
    s = act(s, { type: 'ROLL', dice: [3, 3] }); // ke petak 6 (kosong) → tawaran beli dulu
    expect(s.prompt?.type).toBe('buy');
    s = act(s, { type: 'BUY' });
    expect(s.prompt).toMatchObject({ type: 'card', cardId: 'N01' });
  });

  it('lewat MULAI → ambil Kartu Warga', () => {
    let s = setup(seru(), (d) => (d.players[0].position = 37));
    s = stackDeck(s, 'warga', ['W04']);
    s = act(s, { type: 'ROLL', dice: [2, 4] }); // 37 → 3 (Danau Toba), lewat MULAI
    expect(s.prompt?.type).toBe('buy');
    s = act(s, { type: 'DECLINE_BUY' }, ...[1, 2, 3, 4].map((i) => ({ type: 'PASS_BID' as const, player: `p${i}` })));
    expect(s.prompt).toMatchObject({ type: 'card', cardId: 'W04' });
  });

  it('tidak ada bonus kartu jika pemain masuk Hotel Prodeo', () => {
    let s = setup(seru(), (d) => (d.players[0].position = 26));
    s = act(s, { type: 'ROLL', dice: [2, 2] }); // 26 → 30 KENA OTT!
    expect(pl(s, 'p1').inJail).toBe(true);
    expect(s.prompt).toBeNull();
  });
});

describe('📰 Kabar Nusantara', () => {
  const toNewRound = (s: GameState) => setup(s, (d) => {
    d.current = d.players.length - 1;
    d.phase = 'postRoll';
  });

  it('muncul di awal putaran baru, sebelum pemain pertama melempar', () => {
    let s = act(toNewRound(seru()), { type: 'END_TURN' });
    expect(s.round).toBe(2);
    expect(s.prompt?.type).toBe('event');
    expect(s.current).toBe(0);
  });

  it('tidak muncul di tengah putaran', () => {
    const s = act(setup(seru(), (d) => (d.phase = 'postRoll')), { type: 'END_TURN' });
    expect(s.prompt).toBeNull();
  });

  it.each(EVENTS.map((e) => [e.id, e.title]))('%s %s berjalan & uang tetap seimbang', (id) => {
    let s = toNewRound(seru());
    s = own(s, 'p2', [1, 3], 2);
    s = setup(s, (d) => (d.kabar = { draw: [id], discard: [] }));
    s = act(s, { type: 'END_TURN' });
    expect(s.prompt).toMatchObject({ type: 'event', eventId: id });
    s = act(s, { type: 'EVENT_OK' });
    expect(s.prompt).toBeNull();
    expect(s.phase).toBe('preRoll');
    expect(moneyBalance(s)).toBe(0);
  });

  it('contoh efek: Harga BBM Naik (semua bayar 15), Subsidi UMKM (termiskin +60), Pajak Bangunan', () => {
    let s = setup(toNewRound(seru()), (d) => (d.kabar = { draw: ['K09', 'K03', 'K12'], discard: [] }));
    s = act(s, { type: 'END_TURN' }, { type: 'EVENT_OK' });
    expect(s.players.map((p) => p.cash)).toEqual([1485, 1485, 1485, 1485]);

    s = setup(toNewRound(s), (d) => (d.players[2].cash = 100));
    s = act(s, { type: 'END_TURN' }, { type: 'EVENT_OK' });
    expect(cash(s, 'p3')).toBe(160);

    s = own(toNewRound(s), 'p1', [1, 3], 5);
    s = act(s, { type: 'END_TURN' }, { type: 'EVENT_OK' });
    expect(cash(s, 'p1')).toBe(1485 - 80);
  });
});

describe('Regresi: bangunan dari beberapa pemilik dalam satu grup', () => {
  it('pemain tetap bisa menjual bangunan & menggadai walau pemain lain punya bangunan lebih tinggi di grup yang sama', () => {
    let s = seru();
    s = setup(s, (d) => {
      d.board[6] = { owner: 'p1', level: 1, mortgaged: false };
      d.board[8] = { owner: 'p2', level: 3, mortgaged: false };
    });
    s = act(s, { type: 'SELL_BUILDING', tile: 6 });
    expect(s.board[6].level).toBe(0);
    s = act(s, { type: 'MORTGAGE', tile: 6 });
    expect(s.board[6].mortgaged).toBe(true);
  });

  it('tidak ada jalan buntu: jika dana tak cukup setelah jual & gadai otomatis, bangkrut tersedia', () => {
    let s = seru(2);
    s = setup(s, (d) => {
      d.board[6] = { owner: 'p1', level: 1, mortgaged: false };
      d.board[8] = { owner: 'p2', level: 3, mortgaged: false };
      d.board[39] = { owner: 'p2', level: 5, mortgaged: false };
      d.players[0].cash = 10;
      d.players[0].position = 36;
    });
    s = act(s, { type: 'ROLL', dice: [1, 2] }); // ke Raja Ampat (Resort milik p2)
    expect(s.prompt?.type).toBe('debt');
    s = act(s, { type: 'AUTO_LIQUIDATE' });
    s = act(s, { type: 'DECLARE_BANKRUPTCY' });
    expect(s.phase).toBe('gameOver');
  });
});
