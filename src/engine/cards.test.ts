import { CARDS } from './data.ts';
import { liquidationValue, moneyBalance } from './engine.ts';
import { act, cash, newGame, own, pl, setup, stackDeck } from './testUtils.ts';
import type { GameState } from './types.ts';

/** Bawa pemain 1 ke petak kartu & ambil kartu tertentu (Nasib di petak 7, Warga di petak 17). */
function drawCard(cardId: string, prep?: (d: GameState) => void, n = 4): GameState {
  const deck = cardId.startsWith('N') ? 'nasib' : 'warga';
  let s = setup(newGame(n), (d) => {
    d.players[0].position = deck === 'nasib' ? 0 : 14;
    prep?.(d);
  });
  s = stackDeck(s, deck, [cardId]);
  s = act(s, { type: 'ROLL', dice: deck === 'nasib' ? [3, 4] : [1, 2] });
  expect(s.prompt).toMatchObject({ type: 'card', cardId });
  return s;
}

/** Selesaikan semua keputusan dengan pilihan default sampai antrean kosong. */
function resolveAll(s: GameState): GameState {
  for (let guard = 0; guard < 50 && s.prompt; guard++) {
    const p = s.prompt;
    switch (p.type) {
      case 'card':
        s = act(s, { type: 'CARD_CHOICE', option: p.options.includes('ok') ? 'ok' : p.options[0], die: 2 });
        break;
      case 'buy':
        s = act(s, { type: 'DECLINE_BUY' });
        break;
      case 'auction':
        s = act(s, { type: 'PASS_BID', player: p.bidders[p.turn] });
        break;
      case 'debt':
        if (liquidationValue(s, p.player) >= p.amount) s = act(s, { type: 'AUTO_LIQUIDATE' }, { type: 'PAY_DEBT' });
        else s = act(s, { type: 'DECLARE_BANKRUPTCY' });
        break;
      case 'incomeTax':
        s = act(s, { type: 'INCOME_TAX', choice: 'flat' });
        break;
      case 'pungli':
        s = act(s, { type: 'PUNGLI', choice: 'pay' });
        break;
      case 'freeBuilding':
        s = act(s, { type: 'FREE_BUILDING', tile: p.tiles[0] });
        break;
      case 'jailRoll':
        throw new Error('tidak dipakai');
    }
  }
  expect(s.prompt).toBeNull();
  return s;
}

describe('Setiap kartu (100) bisa dijalankan tanpa error & uang tetap seimbang', () => {
  it.each(CARDS.map((c) => [c.id, c.title]))('%s — %s', (id) => {
    let s = drawCard(id);
    s = resolveAll(s);
    expect(moneyBalance(s)).toBe(0);
    expect(['postRoll', 'preRoll', 'gameOver']).toContain(s.phase);
    // Kartu simpan dipegang pemain, kartu biasa masuk tumpukan buangan.
    const card = CARDS.find((c) => c.id === id)!;
    const deck = s.decks[card.deck];
    const total = deck.draw.length + deck.discard.length + s.players.reduce((a, p) => a + p.items.filter((i) => i.cardId.startsWith(id[0])).length, 0);
    expect(total).toBe(50);
  });
});

describe('Efek kartu spesifik', () => {
  it('RECEIVE — N01 Kontenmu Viral! +50', () => {
    const s = resolveAll(drawCard('N01'));
    expect(cash(s, 'p1')).toBe(1550);
  });

  it('PAY_WARKOP — N31 Tilang Motor Lama masuk Kas Warkop', () => {
    const s = resolveAll(drawCard('N31'));
    expect(s.warkop).toBe(10);
    expect(cash(s, 'p1')).toBe(1490);
  });

  it('MOVE_TO — N07 ke Raja Ampat tanpa lewat MULAI, N04 ke Malioboro', () => {
    let s = act(drawCard('N07'), { type: 'CARD_CHOICE', option: 'ok' });
    expect(pl(s, 'p1').position).toBe(39);
    expect(s.prompt).toMatchObject({ type: 'buy', tile: 39 });
    s = act(drawCard('N04'), { type: 'CARD_CHOICE', option: 'ok' });
    expect(pl(s, 'p1').position).toBe(16);
  });

  it('MOVE_TO — N05 Mudik Lancar Jaya: ke MULAI dan terima gaji', () => {
    const s = resolveAll(drawCard('N05'));
    expect(pl(s, 'p1').position).toBe(0);
    expect(cash(s, 'p1')).toBe(1690);
    expect(s.arisan).toBe(10);
  });

  it('MOVE_TO_NO_SALARY — W41 ke MULAI tanpa gaji', () => {
    const s = resolveAll(drawCard('W41'));
    expect(pl(s, 'p1').position).toBe(0);
    expect(cash(s, 'p1')).toBe(1500);
  });

  it('MOVE_TO_NEAREST_TRANSPORT — N33 bayar 2× sewa', () => {
    let s = drawCard('N33', (d) => (d.board[15] = { owner: 'p2', level: 0, mortgaged: false }));
    s = resolveAll(s);
    expect(pl(s, 'p1').position).toBe(15);
    expect(cash(s, 'p1')).toBe(1450);
    expect(cash(s, 'p2')).toBe(1550);
  });

  it('MOVE_STEPS + bayar — N29 Kabut Asap: masker ke Kas Warkop lalu mundur 3', () => {
    const s = resolveAll(drawCard('N29'));
    expect(pl(s, 'p1').position).toBe(4);
    expect(s.warkop).toBe(5);
    expect(cash(s, 'p1')).toBe(1500 - 5 - 200); // + Pajak Penghasilan (tarif tetap)
  });

  it('PAY_PER_BUILDING — N30 Banjir Kiriman: 25/Homestay, 100/Resort', () => {
    let s = drawCard('N30', (d) => {
      d.board[1] = { owner: 'p1', level: 3, mortgaged: false };
      d.board[3] = { owner: 'p1', level: 5, mortgaged: false };
    });
    s = resolveAll(s);
    expect(cash(s, 'p1')).toBe(1500 - (3 * 25 + 100));
  });

  it('[Bencana] dibatalkan Asuransi Bencana; kartu asuransi kembali ke bawah dek', () => {
    let s = drawCard('N36', (d) => {
      d.board[1] = { owner: 'p1', level: 4, mortgaged: false };
      d.board[3] = { owner: 'p1', level: 4, mortgaged: false };
      d.players[0].items.push({ cardId: 'W23', kind: 'disaster_shield' });
      d.decks.warga.draw = d.decks.warga.draw.filter((c) => c !== 'W23');
    });
    expect(s.prompt).toMatchObject({ options: ['shield', 'ok'] });
    s = act(s, { type: 'CARD_CHOICE', option: 'shield' });
    expect(cash(s, 'p1')).toBe(1500);
    expect(pl(s, 'p1').items).toHaveLength(0);
    expect(s.decks.warga.draw.at(-1)).toBe('W23');
  });

  it('KEEP_ITEM — N09 disimpan, tidak masuk tumpukan buangan', () => {
    const s = resolveAll(drawCard('N09'));
    expect(pl(s, 'p1').items).toEqual([{ cardId: 'N09', kind: 'disaster_shield' }]);
    expect(s.decks.nasib.discard).not.toContain('N09');
  });

  it('DEFERRED_PAY — N50 Pinjol: +50 sekarang, −75 saat lewat MULAI berikutnya', () => {
    let s = resolveAll(drawCard('N50'));
    expect(cash(s, 'p1')).toBe(1550);
    expect(pl(s, 'p1').deferred).toHaveLength(1);
    s = setup(s, (d) => {
      d.phase = 'preRoll';
      d.players[0].position = 38;
    });
    s = act(s, { type: 'ROLL', dice: [1, 2] }); // lewat MULAI ke Aceh
    s = resolveAll(s);
    expect(cash(s, 'p1')).toBe(1550 + 200 - 10 - 75);
    expect(pl(s, 'p1').deferred).toHaveLength(0);
  });

  it('GO_TO_JAIL — N26 KENA OTT! tanpa gaji', () => {
    const s = resolveAll(drawCard('N26'));
    expect(pl(s, 'p1')).toMatchObject({ inJail: true, position: 10, cash: 1500 });
  });

  it('SKIP_OR_PAY — N28 Macet: pilih diam atau bayar ojek Rp 5 jt', () => {
    let s = drawCard('N28');
    expect(s.prompt).toMatchObject({ options: ['skip', 'pay'] });
    s = act(s, { type: 'CARD_CHOICE', option: 'pay' });
    expect(cash(s, 'p1')).toBe(1495);
    s = act(drawCard('N28'), { type: 'CARD_CHOICE', option: 'skip' });
    expect(pl(s, 'p1').skipTurns).toBe(1);
  });

  it('ALL_RECEIVE — N17 Pesta Rakyat: semua pemain +10', () => {
    const s = resolveAll(drawCard('N17'));
    expect(s.players.map((p) => p.cash)).toEqual([1510, 1510, 1510, 1510]);
  });

  it('RECEIVE_FROM_ALL — W03 Kamu Hajatan: +10 dari setiap pemain', () => {
    const s = resolveAll(drawCard('W03'));
    expect(s.players.map((p) => p.cash)).toEqual([1530, 1490, 1490, 1490]);
  });

  it('POOREST_RECEIVE_FROM_ALL — W01 Kerja Bakti: pemain termiskin menerima dari semua', () => {
    const s = resolveAll(drawCard('W01', (d) => (d.players[2].cash = 100)));
    expect(s.players.map((p) => p.cash)).toEqual([1490, 1490, 130, 1490]);
  });

  it('PAY_TO_PLAYER — W27 ke pemain berikutnya (kiri), W39 ke termiskin', () => {
    let s = resolveAll(drawCard('W27'));
    expect(cash(s, 'p2')).toBe(1520);
    s = resolveAll(drawCard('W39', (d) => (d.players[3].cash = 50)));
    expect(cash(s, 'p4')).toBe(60);
    expect(cash(s, 'p1')).toBe(1490);
  });

  it('CONDITIONAL_WEALTH — W28 Bansos: miskin terima 25, kaya (> Rp 1 M) didenda 25 ke Kas Warkop', () => {
    let s = resolveAll(drawCard('W28'));
    expect(cash(s, 'p1')).toBe(1475);
    expect(s.warkop).toBe(25);
    s = resolveAll(drawCard('W28', (d) => (d.players[0].cash = 800)));
    expect(cash(s, 'p1')).toBe(825);
  });

  it('DICE_OUTCOME — W33 No Viral No Justice: genap +20, ganjil −5', () => {
    let s = act(drawCard('W33'), { type: 'CARD_CHOICE', option: 'roll', die: 4 });
    expect(cash(s, 'p1')).toBe(1520);
    s = act(drawCard('W33'), { type: 'CARD_CHOICE', option: 'roll', die: 3 });
    expect(cash(s, 'p1')).toBe(1495);
  });

  it('FREE_BUILDING — W18: Homestay gratis di grup lengkap, kalau tidak punya terima 30', () => {
    let s = drawCard('W18', (d) => {
      d.board[1] = { owner: 'p1', level: 0, mortgaged: false };
      d.board[3] = { owner: 'p1', level: 0, mortgaged: false };
    });
    s = act(s, { type: 'CARD_CHOICE', option: 'ok' });
    expect(s.prompt).toMatchObject({ type: 'freeBuilding', tiles: [1, 3] });
    s = act(s, { type: 'FREE_BUILDING', tile: 3 });
    expect(s.board[3].level).toBe(1);
    expect(cash(s, 'p1')).toBe(1500);
    s = resolveAll(drawCard('W18'));
    expect(cash(s, 'p1')).toBe(1530);
  });

  it('SKIP_TURN — W29 Sistem Offline', () => {
    const s = resolveAll(drawCard('W29'));
    expect(pl(s, 'p1').skipTurns).toBe(1);
  });

  it('dek habis → kartu buangan dikocok ulang (kartu simpan yang dipegang tidak ikut)', () => {
    let s = setup(newGame(), (d) => {
      d.decks.nasib.discard = d.decks.nasib.draw.filter((c) => c !== 'N27');
      d.decks.nasib.draw = [];
      d.players[1].items.push({ cardId: 'N27', kind: 'jail_free' });
    });
    s = act(s, { type: 'ROLL', dice: [3, 4] });
    expect(s.prompt?.type).toBe('card');
    expect(s.decks.nasib.draw).toHaveLength(48);
    expect(s.decks.nasib.draw).not.toContain('N27');
  });

  it('kartu ke properti milik lawan: bayar sewa normal (N13 Bunaken)', () => {
    let s = drawCard('N13', () => {});
    s = own(s, 'p3', [32]);
    s = resolveAll(s);
    expect(cash(s, 'p1')).toBe(1474);
  });
});
