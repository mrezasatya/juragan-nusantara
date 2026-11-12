import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseCards, parsePrices, parseTiles, parseFacts, landmarkOf } from '../content/parseDoc.ts';
import { CARDS, TILES, GROUPS, CONFIG, PROPERTY_TILES, isOwnable } from '../engine/data.ts';
import type { CardEffect } from '../engine/types.ts';

const md = readFileSync(resolve(__dirname, '../../docs/konsep-game-juragan-nusantara.md'), 'utf8');

describe('Data petak (tiles.json)', () => {
  it('berisi 40 petak berurutan 0..39', () => {
    expect(TILES).toHaveLength(40);
    TILES.forEach((t, i) => expect(t.index).toBe(i));
  });

  it('komposisi sesuai Bagian 3.1', () => {
    const count = (k: string) => TILES.filter((t) => t.kind === k).length;
    expect(count('property')).toBe(22);
    expect(count('transport')).toBe(4);
    expect(count('utility')).toBe(2);
    expect(count('tax')).toBe(2);
    expect(count('card')).toBe(5);
    expect(TILES.filter((t) => t.kind === 'card' && t.deck === 'nasib')).toHaveLength(3);
    expect(['start', 'jail', 'warkop', 'goToJail', 'pungli'].map(count)).toEqual([1, 1, 1, 1, 1]);
  });

  it('nama petak identik dengan dokumen', () => {
    for (const row of parseTiles(md)) expect(TILES[row.index].name).toBe(row.name);
  });

  it('harga, sewa, dan nilai gadai identik dengan Bagian 4.2', () => {
    for (const p of parsePrices(md)) {
      const t = TILES[p.index];
      expect(t.kind).toBe('property');
      if (t.kind !== 'property') continue;
      expect(t.price).toBe(p.price);
      expect(t.rent).toEqual(p.rent);
      expect(t.mortgage).toBe(p.mortgage);
      expect(t.mortgage).toBe(t.price / 2);
    }
  });

  it('fakta & sapaan identik dengan Bagian 4.4', () => {
    for (const f of parseFacts(md)) {
      const t = PROPERTY_TILES.find((p) => p.landmark === landmarkOf(f.name));
      expect(t, f.name).toBeDefined();
      expect(t!.fact).toBe(f.fact);
      expect(t!.greeting).toBe(f.greeting);
    }
  });

  it('8 grup warna dengan jumlah anggota & biaya bangun sesuai Bagian 4.1', () => {
    expect(GROUPS).toHaveLength(8);
    const sizes = Object.fromEntries(GROUPS.map((g) => [g.id, PROPERTY_TILES.filter((t) => t.group === g.id).length]));
    expect(sizes).toEqual({ kopi: 2, langit: 3, jambu: 3, jeruk: 3, cabai: 3, kunyit: 3, pandan: 3, nila: 2 });
    for (const t of PROPERTY_TILES) expect(t.buildCost).toBe(GROUPS.find((g) => g.id === t.group)!.buildCost);
  });

  it('harga naik mengikuti rute ke timur', () => {
    const prices = PROPERTY_TILES.map((t) => t.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it('setiap petak punya ikon dan petak yang bisa dimiliki punya harga', () => {
    for (const t of TILES) {
      expect(t.icon).toBeTruthy();
      if (isOwnable(t)) expect(t.price).toBeGreaterThan(0);
    }
  });
});

describe('Data kartu (cards.json)', () => {
  it('100 kartu dengan ID unik', () => {
    expect(CARDS).toHaveLength(100);
    expect(new Set(CARDS.map((c) => c.id)).size).toBe(100);
  });

  it('setiap dek berisi 50 kartu: 25 kebaikan dan 25 sindiran', () => {
    for (const deck of ['nasib', 'warga'] as const) {
      const d = CARDS.filter((c) => c.deck === deck);
      expect(d).toHaveLength(50);
      expect(d.filter((c) => c.side === 'kebaikan')).toHaveLength(25);
      expect(d.filter((c) => c.side === 'sindiran')).toHaveLength(25);
    }
  });

  it('judul, teks, dan keterangan efek identik dengan Bagian 6', () => {
    const raw = parseCards(md);
    expect(raw).toHaveLength(100);
    for (const r of raw) {
      const c = CARDS.find((x) => x.id === r.id)!;
      expect(c.title).toBe(r.title);
      expect(c.text).toBe(r.text);
      expect(c.effectText).toBe(r.effectText);
      expect(c.tags).toEqual(r.tags);
    }
  });

  it('kartu [Bencana] adalah N29, N30, N36 (Bagian 5.8)', () => {
    expect(CARDS.filter((c) => c.tags.includes('bencana')).map((c) => c.id)).toEqual(['N29', 'N30', 'N36']);
  });

  it('kartu simpan sesuai Bagian 5.7', () => {
    const items = CARDS.filter((c) => c.effect.type === 'KEEP_ITEM').map((c) => [c.id, (c.effect as { item: string }).item]);
    expect(items).toEqual([
      ['N09', 'disaster_shield'],
      ['N27', 'jail_free'],
      ['W23', 'disaster_shield'],
      ['W26', 'orang_dalam'],
    ]);
  });

  it('semua jenis efek valid dan tujuan pindah petak ada', () => {
    const valid = new Set([
      'RECEIVE', 'PAY', 'PAY_WARKOP', 'RECEIVE_FROM_ALL', 'ALL_RECEIVE', 'PAY_TO_PLAYER',
      'POOREST_RECEIVE_FROM_ALL', 'TAKE_ARISAN', 'CLEAR_ARISAN', 'MOVE_TO', 'MOVE_TO_NO_SALARY',
      'MOVE_TO_NEAREST_TRANSPORT', 'MOVE_STEPS', 'SKIP_TURN', 'SKIP_OR_PAY', 'GO_TO_JAIL', 'KEEP_ITEM',
      'PAY_PER_BUILDING', 'FREE_BUILDING', 'DICE_OUTCOME', 'CONDITIONAL_WEALTH', 'DEFERRED_PAY',
    ]);
    const used = new Set<string>();
    for (const c of CARDS) {
      expect(valid.has(c.effect.type), c.id).toBe(true);
      used.add(c.effect.type);
      const e = c.effect as CardEffect & { tile?: number; amount?: number };
      if (e.tile !== undefined) expect(TILES[e.tile]).toBeDefined();
      if (e.amount !== undefined) expect(e.amount).toBeGreaterThan(0);
    }
    expect(used.size).toBe(valid.size); // ke-22 jenis efek benar-benar terpakai
  });

  it('nominal pada efek cocok dengan angka di teks efek kartu', () => {
    // Setiap angka "Rp X jt" di teks efek harus muncul di objek efek.
    for (const c of CARDS) {
      const nums = [...c.effectText.matchAll(/Rp (\d+) jt/g)].map((m) => Number(m[1]));
      const json = JSON.stringify(c.effect);
      for (const n of nums) expect(json, `${c.id}: Rp ${n} jt`).toMatch(new RegExp(`:${n}[,}]`));
    }
  });
});

describe('Konfigurasi (config.json)', () => {
  it('sesuai Bagian 5 & 7', () => {
    expect(CONFIG.startMoney).toBe(1500);
    expect(CONFIG.salary).toBe(200);
    expect(CONFIG.arisanFee).toBe(10);
    expect(CONFIG.jail.fine).toBe(50);
    expect(CONFIG.pungli.flat).toBe(20);
    expect(CONFIG.transportRent).toEqual([25, 50, 100, 200]);
    expect(CONFIG.utilityMultiplier).toEqual([4, 10]);
  });
});
