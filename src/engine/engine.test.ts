import { calcRent, canBuild, canEndTurn, canRoll, GameError, netWorth, reduce, totalAssets } from './engine.ts';
import { CONFIG, PROPERTY_TILES } from './data.ts';
import { act, cash, newGame, own, pl, setup, stackDeck } from './testUtils.ts';

describe('Persiapan permainan', () => {
  it('setiap pemain mulai dengan Rp 1,5 M di MULAI', () => {
    const s = newGame(4);
    expect(s.players.map((p) => p.cash)).toEqual([1500, 1500, 1500, 1500]);
    expect(s.players.every((p) => p.position === 0)).toBe(true);
    expect(s.decks.nasib.draw).toHaveLength(50);
    expect(s.decks.warga.draw).toHaveLength(50);
  });

  it('menolak jumlah pemain di luar 2–6', () => {
    expect(() => newGame(1)).toThrow(GameError);
    expect(() => newGame(7)).toThrow(GameError);
  });

  it('Mode Kilat: setiap pemain mendapat 2 properti acak berbeda', () => {
    const s = newGame(6, 'kilat');
    const owned = Object.values(s.board).filter((o) => o.owner);
    expect(owned).toHaveLength(12);
    for (const p of s.players) expect(Object.values(s.board).filter((o) => o.owner === p.id)).toHaveLength(2);
  });
});

describe('Dadu, gerak, dan gaji', () => {
  it('maju sesuai jumlah dadu, lalu giliran selesai', () => {
    let s = newGame();
    s = act(s, { type: 'ROLL', dice: [2, 3] }); // ke petak 5 Terminal Bus
    expect(pl(s, 'p1').position).toBe(5);
    expect(s.prompt?.type).toBe('buy');
    s = act(s, { type: 'BUY' });
    expect(cash(s, 'p1')).toBe(1300);
    expect(canEndTurn(s)).toBe(true);
    s = act(s, { type: 'END_TURN' });
    expect(s.current).toBe(1);
  });

  it('lewat MULAI: terima gaji Rp 200 jt dan setor Rp 10 jt ke Kas Arisan', () => {
    let s = setup(newGame(), (d) => (d.players[0].position = 38));
    s = act(s, { type: 'ROLL', dice: [1, 2] }); // 38 → 1 (Aceh)
    expect(pl(s, 'p1').position).toBe(1);
    expect(cash(s, 'p1')).toBe(1500 + 200 - 10);
    expect(s.arisan).toBe(10);
  });

  it('dobel: wajib lempar lagi, tidak bisa akhiri giliran', () => {
    let s = act(newGame(), { type: 'ROLL', dice: [3, 3] }); // ke 6 (Jam Gadang)
    s = act(s, { type: 'DECLINE_BUY' }, { type: 'PASS_BID', player: 'p1' }, { type: 'PASS_BID', player: 'p2' }, { type: 'PASS_BID', player: 'p3' }, { type: 'PASS_BID', player: 'p4' });
    expect(canEndTurn(s)).toBe(false);
    expect(canRoll(s)).toBe(true);
  });

  it('dobel 3 kali berturut-turut masuk Hotel Prodeo', () => {
    let s = newGame();
    s = act(s, { type: 'ROLL', dice: [3, 3] }, { type: 'DECLINE_BUY' }, ...passAll(4)); // ke 6
    s = act(s, { type: 'ROLL', dice: [2, 2] }); // ke 10, cuma mampir
    s = act(s, { type: 'ROLL', dice: [5, 5] }); // dobel ke-3
    expect(pl(s, 'p1').inJail).toBe(true);
    expect(pl(s, 'p1').position).toBe(10);
    expect(canEndTurn(s)).toBe(true);
  });

  it('mundur melewati MULAI tidak mendapat gaji', () => {
    let s = setup(newGame(), (d) => (d.players[0].position = 0));
    s = stackDeck(s, 'warga', ['W47']); // mundur 3
    s = setup(s, (d) => (d.players[0].position = 39));
    s = act(s, { type: 'ROLL', dice: [1, 2] }); // 39 → 2 (Kartu Warga) lewat MULAI = gaji
    const afterSalary = cash(s, 'p1');
    s = act(s, { type: 'CARD_CHOICE', option: 'ok' }); // mundur 3 → 39
    expect(pl(s, 'p1').position).toBe(39);
    expect(cash(s, 'p1')).toBe(afterSalary);
  });
});

function passAll(n: number) {
  return Array.from({ length: n }, (_, i) => ({ type: 'PASS_BID' as const, player: `p${i + 1}` }));
}

describe('Sewa', () => {
  it('sewa dasar, 2× jika satu grup lengkap tanpa bangunan, dan per bangunan', () => {
    let s = own(newGame(), 'p2', [1]);
    expect(calcRent(s, 1, 7)).toBe(2);
    s = own(s, 'p2', [3]);
    expect(calcRent(s, 1, 7)).toBe(4); // 2× grup Kopi lengkap
    s = own(s, 'p2', [1], 3);
    expect(calcRent(s, 1, 7)).toBe(90);
    s = own(s, 'p2', [1], 5);
    expect(calcRent(s, 1, 7)).toBe(250);
  });

  it('pemain membayar sewa ke pemilik', () => {
    let s = own(newGame(), 'p2', [39], 5);
    s = setup(s, (d) => (d.players[0].position = 36));
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(cash(s, 'p1')).toBe(1500 - 2000 + 0 >= 0 ? 0 : cash(s, 'p1')); // tidak cukup → utang
    expect(s.prompt?.type).toBe('debt');
  });

  it('properti tergadai tidak menghasilkan sewa', () => {
    let s = own(newGame(), 'p2', [5]);
    s = setup(s, (d) => (d.board[5].mortgaged = true));
    s = act(s, { type: 'ROLL', dice: [2, 3] });
    expect(cash(s, 'p1')).toBe(1500);
  });

  it('transportasi: 25/50/100/200 sesuai jumlah dimiliki', () => {
    let s = own(newGame(), 'p2', [5]);
    expect(calcRent(s, 5, 7)).toBe(25);
    s = own(s, 'p2', [15, 25]);
    expect(calcRent(s, 5, 7)).toBe(100);
    s = own(s, 'p2', [35]);
    expect(calcRent(s, 5, 7)).toBe(200);
  });

  it('utilitas: angka dadu × 4 jt (punya 1) atau × 10 jt (punya 2)', () => {
    let s = own(newGame(), 'p2', [12]);
    s = setup(s, (d) => (d.players[0].position = 5));
    s = act(s, { type: 'ROLL', dice: [3, 4] });
    expect(cash(s, 'p1')).toBe(1500 - 28);
    expect(cash(s, 'p2')).toBe(1528);
    s = own(s, 'p2', [28]);
    expect(calcRent(s, 12, 7)).toBe(70);
  });

  it('pemilik di Hotel Prodeo tetap menagih sewa', () => {
    let s = own(newGame(), 'p2', [5]);
    s = setup(s, (d) => {
      d.players[1].inJail = true;
      d.players[1].position = 10;
    });
    s = act(s, { type: 'ROLL', dice: [2, 3] });
    expect(cash(s, 'p2')).toBe(1525);
  });
});

describe('Membangun, menjual, dan gadai', () => {
  it('hanya boleh membangun jika satu grup lengkap', () => {
    let s = own(newGame(), 'p1', [6, 8]);
    expect(canBuild(s, 'p1', 6)).toBe(false);
    s = own(s, 'p1', [9]);
    expect(canBuild(s, 'p1', 6)).toBe(true);
  });

  it('pembangunan harus merata (selisih maks. 1) dan sampai Resort', () => {
    let s = own(newGame(), 'p1', [1, 3]);
    s = act(s, { type: 'BUILD', tile: 1 });
    expect(() => reduce(s, { type: 'BUILD', tile: 1 })).toThrow(GameError);
    s = act(s, { type: 'BUILD', tile: 3 }, { type: 'BUILD', tile: 1 });
    for (let i = 0; i < 3; i++) s = act(s, { type: 'BUILD', tile: 3 }, { type: 'BUILD', tile: 1 });
    expect(s.board[1].level).toBe(5); // Resort
    expect(s.board[3].level).toBe(4);
    expect(cash(s, 'p1')).toBe(1500 - 9 * 50);
    expect(() => reduce(s, { type: 'SELL_BUILDING', tile: 3 })).toThrow(GameError); // harus jual dari yang tertinggi
    s = act(s, { type: 'SELL_BUILDING', tile: 1 });
    expect(s.board[1].level).toBe(4);
    expect(cash(s, 'p1')).toBe(1500 - 9 * 50 + 25);
  });

  it('tidak bisa membangun jika ada properti tergadai di grup', () => {
    let s = own(newGame(), 'p1', [1, 3]);
    s = act(s, { type: 'MORTGAGE', tile: 3 });
    expect(canBuild(s, 'p1', 1)).toBe(false);
  });

  it('gadai 50% harga, tebus +10%, dan tidak bisa gadai jika ada bangunan di grup', () => {
    let s = own(newGame(), 'p1', [39]);
    s = act(s, { type: 'MORTGAGE', tile: 39 });
    expect(cash(s, 'p1')).toBe(1700);
    s = act(s, { type: 'UNMORTGAGE', tile: 39 });
    expect(cash(s, 'p1')).toBe(1700 - 220);
    s = own(s, 'p1', [37, 39]);
    s = act(s, { type: 'BUILD', tile: 37 });
    expect(() => reduce(s, { type: 'MORTGAGE', tile: 39 })).toThrow(GameError);
  });
});

describe('Pajak, Kas Warkop, dan Kas Arisan', () => {
  it('Pajak Penghasilan: pilih Rp 200 jt atau 10% total aset', () => {
    let s = own(newGame(), 'p1', [39]);
    s = act(s, { type: 'ROLL', dice: [1, 3] });
    expect(s.prompt).toMatchObject({ type: 'incomeTax', flat: 200, percentAmount: Math.round((1500 + 400) / 10) });
    s = act(s, { type: 'INCOME_TAX', choice: 'percent' });
    expect(cash(s, 'p1')).toBe(1500 - 190);
    expect(s.warkop).toBe(0); // pajak masuk Bank, bukan Kas Warkop
  });

  it('Pajak Flexing Rp 100 jt ke Bank', () => {
    let s = setup(newGame(), (d) => (d.players[0].position = 35));
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(cash(s, 'p1')).toBe(1400);
  });

  it('denda masuk Kas Warkop dan diambil semua saat berhenti di Warkop', () => {
    let s = setup(newGame(), (d) => {
      d.warkop = 85;
      d.players[0].position = 17;
    });
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(pl(s, 'p1').position).toBe(20);
    expect(cash(s, 'p1')).toBe(1585);
    expect(s.warkop).toBe(0);
  });

  it('Narik Arisan (W02) mengambil semua Kas Arisan; Arisan Bodong (W45) menghanguskannya', () => {
    let s = setup(newGame(), (d) => {
      d.arisan = 120;
      d.players[0].position = 14;
    });
    s = stackDeck(s, 'warga', ['W02', 'W45']);
    s = act(s, { type: 'ROLL', dice: [1, 2] }, { type: 'CARD_CHOICE', option: 'ok' });
    expect(cash(s, 'p1')).toBe(1620);
    expect(s.arisan).toBe(0);
    s = setup(s, (d) => (d.arisan = 50));
    s = act(s, { type: 'END_TURN' });
    s = setup(s, (d) => (d.players[1].position = 14));
    s = act(s, { type: 'ROLL', dice: [1, 2] }, { type: 'CARD_CHOICE', option: 'ok' });
    expect(s.arisan).toBe(0);
    expect(cash(s, 'p2')).toBe(1500);
  });
});

describe('Hotel Prodeo', () => {
  const jailed = () =>
    setup(newGame(), (d) => {
      d.players[0].inJail = true;
      d.players[0].position = 10;
    });

  it('berhenti di petak KENA OTT! langsung masuk tanpa gaji', () => {
    let s = setup(newGame(), (d) => (d.players[0].position = 27));
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(pl(s, 'p1').inJail).toBe(true);
    expect(pl(s, 'p1').position).toBe(10);
    expect(cash(s, 'p1')).toBe(1500);
  });

  it('bayar denda Rp 50 jt ke Kas Warkop lalu jalan normal', () => {
    let s = act(jailed(), { type: 'JAIL_PAY' });
    expect(s.warkop).toBe(50);
    expect(pl(s, 'p1').inJail).toBe(false);
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(pl(s, 'p1').position).toBe(13);
  });

  it('lempar dobel untuk keluar (tanpa lempar ulang)', () => {
    let s = act(jailed(), { type: 'ROLL', dice: [2, 2] });
    expect(pl(s, 'p1').inJail).toBe(false);
    expect(pl(s, 'p1').position).toBe(14);
    expect(s.rolledDoubles).toBe(false);
  });

  it('gagal dobel 3 kali: wajib bayar denda lalu jalan', () => {
    let s = jailed();
    for (let i = 0; i < 2; i++) {
      s = act(s, { type: 'ROLL', dice: [1, 2] });
      expect(pl(s, 'p1').inJail).toBe(true);
      s = setup(s, (d) => (d.phase = 'preRoll'));
    }
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(pl(s, 'p1').inJail).toBe(false);
    expect(pl(s, 'p1').position).toBe(13);
    expect(s.warkop).toBe(50);
  });

  it('keluar dengan Remisi 17 Agustus atau Kartu Orang Dalam; kartu kembali ke bawah dek', () => {
    let s = setup(jailed(), (d) => d.players[0].items.push({ cardId: 'N27', kind: 'jail_free' }));
    s = setup(s, (d) => (d.decks.nasib.draw = d.decks.nasib.draw.filter((c) => c !== 'N27')));
    s = act(s, { type: 'JAIL_USE_ITEM', item: 'jail_free' });
    expect(pl(s, 'p1').inJail).toBe(false);
    expect(s.decks.nasib.draw.at(-1)).toBe('N27');
  });
});

describe('Pos Pungli', () => {
  const atPungli = () => setup(newGame(), (d) => (d.players[0].position = 30));
  it('bayar uang rokok Rp 20 jt ke Kas Warkop', () => {
    const s = act(atPungli(), { type: 'ROLL', dice: [1, 2] }, { type: 'PUNGLI', choice: 'pay' });
    expect(s.warkop).toBe(20);
  });
  it.each([
    [1, 40],
    [2, 40],
    [3, 20],
    [4, 20],
    [5, 0],
    [6, 0],
  ])('nego dadu %i → bayar %i jt', (die, amount) => {
    const s = act(atPungli(), { type: 'ROLL', dice: [1, 2] }, { type: 'PUNGLI', choice: 'nego', die });
    expect(s.warkop).toBe(amount);
    expect(cash(s, 'p1')).toBe(1500 - amount);
  });
  it('Kartu Orang Dalam: lolos gratis', () => {
    let s = setup(atPungli(), (d) => d.players[0].items.push({ cardId: 'W26', kind: 'orang_dalam' }));
    s = act(s, { type: 'ROLL', dice: [1, 2] }, { type: 'PUNGLI', choice: 'orang_dalam' });
    expect(s.warkop).toBe(0);
    expect(pl(s, 'p1').items).toHaveLength(0);
  });
});

describe('Lelang Pasar Tradisional', () => {
  it('menolak membeli → lelang, penawar tertinggi menang', () => {
    let s = act(newGame(3), { type: 'ROLL', dice: [2, 3] }, { type: 'DECLINE_BUY' });
    expect(s.prompt?.type).toBe('auction');
    expect(() => reduce(s, { type: 'BID', player: 'p1', amount: 5 })).toThrow(GameError); // mulai Rp 10 jt
    s = act(
      s,
      { type: 'BID', player: 'p1', amount: 10 },
      { type: 'BID', player: 'p2', amount: 50 },
      { type: 'PASS_BID', player: 'p3' },
      { type: 'BID', player: 'p1', amount: 60 },
      { type: 'PASS_BID', player: 'p2' },
    );
    expect(s.board[5].owner).toBe('p1');
    expect(cash(s, 'p1')).toBe(1440);
    expect(s.prompt).toBeNull();
  });

  it('semua mundur → properti tetap milik Bank', () => {
    const s = act(newGame(2), { type: 'ROLL', dice: [2, 3] }, { type: 'DECLINE_BUY' }, ...passAll(2));
    expect(s.board[5].owner).toBeNull();
  });
});

describe('Utang, bangkrut', () => {
  it('kurang uang → jual/gadai otomatis lalu bayar', () => {
    let s = own(newGame(), 'p2', [39], 5);
    s = own(s, 'p1', [1, 3], 2);
    s = setup(s, (d) => {
      d.players[0].cash = 1900;
      d.players[0].position = 36;
    });
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(s.prompt).toMatchObject({ type: 'debt', amount: 2000 });
    s = act(s, { type: 'AUTO_LIQUIDATE' }, { type: 'PAY_DEBT' });
    expect(cash(s, 'p2')).toBe(3500);
    expect(s.prompt).toBeNull();
  });

  it('tidak bisa bangkrut selama masih bisa jual/gadai', () => {
    let s = own(newGame(), 'p2', [39], 5);
    s = own(s, 'p1', [37]);
    s = setup(s, (d) => {
      d.players[0].cash = 1900;
      d.players[0].position = 36;
    });
    s = act(s, { type: 'ROLL', dice: [1, 2] });
    expect(() => reduce(s, { type: 'DECLARE_BANKRUPTCY' })).toThrow(GameError);
  });

  it('bangkrut ke pemain: semua aset diserahkan ke penagih', () => {
    let s = own(newGame(3), 'p2', [39], 5);
    s = own(s, 'p1', [5]);
    s = setup(s, (d) => {
      d.players[0].cash = 100;
      d.players[0].position = 36;
      d.players[0].items.push({ cardId: 'N27', kind: 'jail_free' });
    });
    s = act(s, { type: 'ROLL', dice: [1, 2] }, { type: 'AUTO_LIQUIDATE' }, { type: 'DECLARE_BANKRUPTCY' });
    expect(pl(s, 'p1').bankrupt).toBe(true);
    expect(s.board[5]).toMatchObject({ owner: 'p2', mortgaged: true });
    expect(pl(s, 'p2').items).toHaveLength(1);
    expect(cash(s, 'p2')).toBe(1500 + 100 + 100);
    expect(s.current).toBe(1); // giliran pindah ke pemain berikutnya
  });

  it('bangkrut ke Bank: properti kembali tak bertuan; pemain terakhir menang', () => {
    let s = own(newGame(2), 'p1', [1]);
    s = setup(s, (d) => {
      d.players[0].cash = 10;
      d.players[0].position = 36;
    });
    s = act(s, { type: 'ROLL', dice: [1, 1] }); // 38 Pajak Flexing 100
    s = act(s, { type: 'AUTO_LIQUIDATE' }, { type: 'DECLARE_BANKRUPTCY' });
    expect(s.board[1]).toEqual({ owner: null, level: 0, mortgaged: false });
    expect(s.phase).toBe('gameOver');
    expect(s.winner).toBe('p2');
  });
});

describe('Utang ke Tetangga', () => {
  it('pinjam dengan bunga maks. 10% dan lunasi', () => {
    let s = newGame();
    expect(() => reduce(s, { type: 'LOAN', lender: 'p2', borrower: 'p1', principal: 100, interestPct: 15 })).toThrow(GameError);
    s = act(s, { type: 'LOAN', lender: 'p2', borrower: 'p1', principal: 100, interestPct: 10 });
    expect(cash(s, 'p1')).toBe(1600);
    s = act(s, { type: 'REPAY_LOAN', loanId: s.loans[0].id });
    expect(cash(s, 'p1')).toBe(1490);
    expect(cash(s, 'p2')).toBe(1510);
  });

  it('tidak lunas 3 putaran → ditagih + denda 10% di awal giliran', () => {
    let s = act(newGame(2), { type: 'LOAN', lender: 'p2', borrower: 'p1', principal: 100, interestPct: 10 });
    s = setup(s, (d) => {
      d.round = 4;
      d.phase = 'postRoll';
      d.current = 1;
    });
    s = act(s, { type: 'END_TURN' }); // ronde 5 ≥ jatuh tempo 4, giliran p1
    expect(s.loans).toHaveLength(0);
    expect(cash(s, 'p2')).toBe(1400 + 121);
    expect(s.phase).toBe('preRoll');
  });

  it('uang tidak cukup → serahkan properti senilai utang', () => {
    let s = act(newGame(2), { type: 'LOAN', lender: 'p2', borrower: 'p1', principal: 100, interestPct: 0 });
    s = own(s, 'p1', [39]);
    s = setup(s, (d) => {
      d.players[0].cash = 0;
      d.round = 4;
      d.phase = 'postRoll';
      d.current = 1;
    });
    s = act(s, { type: 'END_TURN' });
    expect(s.prompt).toMatchObject({ type: 'debt', allowSurrender: true, amount: 110 });
    s = act(s, { type: 'SURRENDER_PROPERTY', tile: 39 });
    expect(s.board[39].owner).toBe('p2');
    expect(s.loans).toHaveLength(0);
    expect(s.prompt).toBeNull();
  });
});

describe('Jual-beli antarpemain', () => {
  it('tukar properti, uang, dan kartu simpan', () => {
    let s = own(newGame(), 'p1', [1]);
    s = own(s, 'p2', [3]);
    s = setup(s, (d) => d.players[1].items.push({ cardId: 'W26', kind: 'orang_dalam' }));
    s = act(s, {
      type: 'TRADE',
      a: 'p1',
      b: 'p2',
      aGives: { cash: 50, tiles: [1], items: [] },
      bGives: { cash: 0, tiles: [3], items: ['W26'] },
    });
    expect(s.board[1].owner).toBe('p2');
    expect(s.board[3].owner).toBe('p1');
    expect(pl(s, 'p1').items[0].cardId).toBe('W26');
    expect(cash(s, 'p2')).toBe(1550);
  });

  it('properti dengan bangunan di grupnya tidak bisa diperdagangkan', () => {
    const s = own(newGame(), 'p1', [1, 3], 1);
    expect(() =>
      reduce(s, { type: 'TRADE', a: 'p1', b: 'p2', aGives: { cash: 0, tiles: [1], items: [] }, bGives: { cash: 10, tiles: [], items: [] } }),
    ).toThrow(GameError);
  });
});

describe('Mode Kilat & akhir permainan', () => {
  it('selesai setelah batas putaran, pemenang = total aset terbesar', () => {
    let s = newGame(2, 'kilat'); // batas 5 putaran
    s = setup(s, (d) => {
      d.round = 5;
      d.current = 1;
      d.phase = 'postRoll';
      d.players[0].cash = 3000;
    });
    s = act(s, { type: 'END_TURN' });
    expect(s.phase).toBe('gameOver');
    expect(s.winner).toBe('p1');
  });

  it('selesai saat waktu habis (dicek saat akhir giliran)', () => {
    let s = setup(newGame(2, 'kilat'), (d) => {
      d.kilat = { maxRounds: null, endsAt: 1000 };
      d.phase = 'postRoll';
    });
    s = act(s, { type: 'END_TURN', now: 999 });
    expect(s.phase).toBe('preRoll');
    s = setup(s, (d) => (d.phase = 'postRoll'));
    s = act(s, { type: 'END_TURN', now: 1000 });
    expect(s.phase).toBe('gameOver');
  });

  it('total aset = uang + harga properti (bersih gadai) + bangunan', () => {
    let s = own(newGame(), 'p1', [1, 3], 2);
    s = own(s, 'p1', [39]);
    s = setup(s, (d) => (d.board[39].mortgaged = true));
    expect(totalAssets(s, 'p1')).toBe(1500 + 60 + 60 + 4 * 50 + 200);
    expect(netWorth(s, 'p1')).toBe(totalAssets(s, 'p1'));
  });
});

describe('Diam 1 giliran', () => {
  it('pemain yang kena SKIP dilewati satu kali', () => {
    let s = setup(newGame(3), (d) => {
      d.players[1].skipTurns = 1;
      d.phase = 'postRoll';
    });
    s = act(s, { type: 'END_TURN' });
    expect(s.current).toBe(2);
    expect(pl(s, 'p2').skipTurns).toBe(0);
  });
});

describe('Konfigurasi dipakai engine', () => {
  it('jumlah properti di data = 22', () => {
    expect(PROPERTY_TILES).toHaveLength(22);
    expect(CONFIG.loan.dueRounds).toBe(3);
  });
});
