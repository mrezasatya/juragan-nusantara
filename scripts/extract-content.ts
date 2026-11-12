// Menghasilkan src/data/tiles.json, cards.json, groups.json dari dokumen konsep.
// Jalankan: npm run extract
// Teks (nama petak, caption, fakta, sapaan, judul & teks kartu) diambil apa adanya
// dari dokumen. Yang ditulis manual di sini hanya: ikon, data grup, dan pemetaan efek
// kartu ke jenis efek engine (Bagian 11.5).

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseCards,
  parseFacts,
  parsePrices,
  parseTiles,
  splitNote,
  landmarkOf,
  regionOf,
} from '../src/content/parseDoc.ts';
import type { Card, CardEffect, GroupId, GroupInfo, Tile } from '../src/engine/types.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const md = readFileSync(resolve(root, 'docs/konsep-game-juragan-nusantara.md'), 'utf8');

export const GROUPS: GroupInfo[] = [
  { id: 'kopi', name: 'Kopi', color: '#7A4A2A', region: 'Sumatra bagian utara', motif: 'Motif Pintu Aceh & ulos', buildCost: 50 },
  { id: 'langit', name: 'Langit', color: '#7EC8E3', region: 'Sumatra bagian tengah-selatan', motif: 'Songket', buildCost: 50 },
  { id: 'jambu', name: 'Jambu', color: '#E87CA0', region: 'Jawa bagian barat', motif: 'Batik mega mendung & motif Betawi', buildCost: 100 },
  { id: 'jeruk', name: 'Jeruk', color: '#F08A24', region: 'Jawa bagian tengah-timur', motif: 'Batik parang & kawung', buildCost: 100 },
  { id: 'cabai', name: 'Cabai', color: '#D32F2F', region: 'Bali & Nusa Tenggara', motif: 'Endek & tenun ikat', buildCost: 150 },
  { id: 'kunyit', name: 'Kunyit', color: '#F2C230', region: 'Kalimantan', motif: 'Motif Dayak', buildCost: 150 },
  { id: 'pandan', name: 'Pandan', color: '#3E9A4A', region: 'Sulawesi', motif: 'Tenun sutra Bugis & motif pinisi', buildCost: 200 },
  { id: 'nila', name: 'Nila', color: '#1F3F8B', region: 'Maluku & Papua', motif: 'Motif ukiran Papua & cengkih-pala', buildCost: 200 },
];

const ICONS: Record<number, string> = {
  0: '💰', 1: '📍', 2: '🏘️', 3: '🌊', 4: '🧾', 5: '🚌', 6: '🕰️', 7: '🎴', 8: '🌉', 9: '🪨',
  10: '🛋️', 11: '🦏', 12: '⚡', 13: '🏛️', 14: '🗼', 15: '🚆', 16: '🛍️', 17: '🏘️', 18: '🚪', 19: '🌋',
  20: '☕', 21: '🌾', 22: '🎴', 23: '⛰️', 24: '🦎', 25: '⛴️', 26: '🧭', 27: '🛶', 28: '🚰', 29: '🐢',
  30: '🚨', 31: '⛵', 32: '🐠', 33: '🪙', 34: '🪸', 35: '✈️', 36: '🎴', 37: '🌰', 38: '🕶️', 39: '🏝️',
};

const SHORT: Record<number, string> = {
  0: 'MULAI', 2: 'Kartu Warga', 4: 'Pajak Penghasilan', 5: 'Terminal Bus', 7: 'Kartu Nasib',
  10: 'Hotel Prodeo', 12: 'Token Listrik', 15: 'Stasiun Kereta', 17: 'Kartu Warga', 20: 'Warkop',
  22: 'Kartu Nasib', 25: 'Pelabuhan', 28: 'Air Bersih', 30: 'KENA OTT!', 33: 'Pos Pungli',
  35: 'Bandara', 36: 'Kartu Nasib', 38: 'Pajak Flexing',
};

// Penjelasan aturan untuk tooltip (ditulis ulang dari Bagian 3.1, 4.3, dan 5).
const RULES: Record<number, string> = {
  0: 'Terima Rp 200 jt setiap lewat atau berhenti di sini. Otomatis setor Rp 10 jt ke Kas Arisan.',
  4: 'Bayar Rp 200 jt atau 10% total aset (pilih salah satu).',
  10: 'Kalau cuma mampir, tidak terjadi apa-apa. Kalau masuk karena OTT: keluar dengan bayar denda Rp 50 jt ke Kas Warkop, lempar dobel (maks. 3 giliran), atau pakai Kartu Remisi / Orang Dalam. Selama di sini tetap boleh menagih sewa.',
  20: 'Ambil seluruh isi Kas Warkop (kumpulan denda, pungli, dan iuran).',
  30: 'Langsung masuk Hotel Prodeo tanpa lewat MULAI (tidak dapat gaji).',
  33: 'Pilih: bayar "uang rokok" Rp 20 jt ke Kas Warkop, atau nego dengan lempar 1 dadu (1–2 bayar Rp 40 jt, 3–4 bayar Rp 20 jt, 5–6 gratis). Pemegang Kartu Orang Dalam boleh lolos gratis.',
  38: 'Bayar Rp 100 jt ke Bank.',
  2: 'Ambil satu Kartu Warga.',
  17: 'Ambil satu Kartu Warga.',
  7: 'Ambil satu Kartu Nasib.',
  22: 'Ambil satu Kartu Nasib.',
  36: 'Ambil satu Kartu Nasib.',
};
const TRANSPORT_RULE = 'Harga Rp 200 jt. Sewa: punya 1 = Rp 25 jt, 2 = Rp 50 jt, 3 = Rp 100 jt, 4 = Rp 200 jt.';
const UTILITY_RULE = 'Harga Rp 150 jt. Sewa: punya 1 = angka dadu × Rp 4 jt, punya 2 = angka dadu × Rp 10 jt.';

const GROUP_BY_NAME: Record<string, GroupId> = Object.fromEntries(GROUPS.map((g) => [g.name, g.id]));

function buildTiles(): Tile[] {
  const rows = parseTiles(md);
  const prices = parsePrices(md);
  const facts = parseFacts(md);
  return rows.map((r): Tile => {
    const { rule, caption } = splitNote(r.note);
    const base = {
      index: r.index,
      name: r.name,
      short: SHORT[r.index] ?? landmarkOf(r.name),
      icon: ICONS[r.index],
      caption,
      rule: RULES[r.index] ?? rule,
    };
    const prop = r.kind.match(/^Properti \((\w+)\)$/);
    if (prop) {
      const group = GROUP_BY_NAME[prop[1]];
      const price = prices.find((p) => p.index === r.index);
      if (!group || !price) throw new Error(`Data properti tidak lengkap untuk petak ${r.index}`);
      const lm = landmarkOf(r.name);
      const fact = facts.find((f) => landmarkOf(f.name) === lm);
      if (!fact) throw new Error(`Fakta tidak ditemukan untuk ${r.name}`);
      return {
        ...base,
        kind: 'property',
        group,
        province: regionOf(r.name),
        provinceShort: regionOf(price.name),
        landmark: lm,
        price: price.price,
        rent: price.rent,
        mortgage: price.mortgage,
        buildCost: GROUPS.find((g) => g.id === group)!.buildCost,
        fact: fact.fact,
        greeting: fact.greeting,
      };
    }
    switch (r.kind) {
      case 'Transportasi':
        return { ...base, kind: 'transport', price: 200, mortgage: 100, rule: TRANSPORT_RULE };
      case 'Utilitas':
        return { ...base, kind: 'utility', price: 150, mortgage: 75, rule: UTILITY_RULE };
      case 'Pajak':
        return r.index === 4
          ? { ...base, kind: 'tax', amount: 200, percent: 10 }
          : { ...base, kind: 'tax', amount: 100, percent: null };
      case 'Kartu':
        return { ...base, kind: 'card', deck: r.name.includes('Nasib') ? 'nasib' : 'warga' };
      case 'Spesial': {
        const kind = ({ 0: 'start', 10: 'jail', 20: 'warkop', 30: 'goToJail', 33: 'pungli' } as const)[
          r.index as 0 | 10 | 20 | 30 | 33
        ];
        if (!kind) throw new Error(`Petak spesial tak dikenal: ${r.index}`);
        return { ...base, kind };
      }
      default:
        throw new Error(`Jenis petak tak dikenal: ${r.kind}`);
    }
  });
}

// ===== Pemetaan efek kartu (Bagian 6 → jenis efek Bagian 11.5) =====
const R = (amount: number): CardEffect => ({ type: 'RECEIVE', amount });
const P = (amount: number): CardEffect => ({ type: 'PAY', amount });
const PW = (amount: number): CardEffect => ({ type: 'PAY_WARKOP', amount });
const SKIP: CardEffect = { type: 'SKIP_TURN' };

export const EFFECTS: Record<string, CardEffect> = {
  // Kartu Nasib — kebaikan
  N01: R(50), N02: R(30), N03: R(20),
  N04: { type: 'MOVE_TO', tile: 16 },
  N05: { type: 'MOVE_TO', tile: 0 },
  N06: R(25),
  N07: { type: 'MOVE_TO', tile: 39 },
  N08: R(15),
  N09: { type: 'KEEP_ITEM', item: 'disaster_shield' },
  N10: R(40), N11: R(60),
  N12: { type: 'MOVE_STEPS', steps: 4 },
  N13: { type: 'MOVE_TO', tile: 32 },
  N14: R(35), N15: R(40), N16: R(25),
  N17: { type: 'ALL_RECEIVE', amount: 10 },
  N18: { type: 'MOVE_TO', tile: 31 },
  N19: { type: 'MOVE_TO', tile: 19 },
  N20: R(20), N21: R(45), N22: R(20), N23: R(25), N24: R(30), N25: R(30),
  // Kartu Nasib — sindiran
  N26: { type: 'GO_TO_JAIL' },
  N27: { type: 'KEEP_ITEM', item: 'jail_free' },
  N28: { type: 'SKIP_OR_PAY', amount: 5, to: 'bank' },
  N29: { type: 'MOVE_STEPS', steps: -3, alsoPay: { amount: 5, to: 'warkop' } },
  N30: { type: 'PAY_PER_BUILDING', perHomestay: 25, perResort: 100, to: 'bank' },
  N31: PW(10), N32: P(15),
  N33: { type: 'MOVE_TO_NEAREST_TRANSPORT', rentMultiplier: 2 },
  N34: P(40),
  N35: { type: 'MOVE_STEPS', steps: -3 },
  N36: { type: 'PAY_PER_BUILDING', perHomestay: 15, perResort: 60, to: 'bank' },
  N37: PW(15),
  N38: { type: 'MOVE_STEPS', steps: -2 },
  N39: P(20), N40: P(50),
  N41: { type: 'MOVE_TO', tile: 35 },
  N42: PW(5), N43: P(25), N44: SKIP, N45: SKIP, N46: P(30), N47: P(30), N48: P(10), N49: P(15),
  N50: { type: 'DEFERRED_PAY', receive: 50, pay: 75, trigger: 'pass_start' },
  // Kartu Warga — kebaikan
  W01: { type: 'POOREST_RECEIVE_FROM_ALL', amount: 10 },
  W02: { type: 'TAKE_ARISAN' },
  W03: { type: 'RECEIVE_FROM_ALL', amount: 10 },
  W04: R(10), W05: R(50), W06: R(20), W07: R(25), W08: R(30), W09: R(15), W10: R(15), W11: R(20),
  W12: R(10),
  W13: { type: 'ALL_RECEIVE', amount: 5 },
  W14: R(15), W15: R(30), W16: R(10), W17: R(20),
  W18: { type: 'FREE_BUILDING', fallbackAmount: 30 },
  W19: R(40), W20: R(15), W21: R(35), W22: R(20),
  W23: { type: 'KEEP_ITEM', item: 'disaster_shield' },
  W24: R(10), W25: R(10),
  // Kartu Warga — sindiran
  W26: { type: 'KEEP_ITEM', item: 'orang_dalam' },
  W27: { type: 'PAY_TO_PLAYER', amount: 20, target: 'left' },
  W28: { type: 'CONDITIONAL_WEALTH', receive: 25, threshold: 1000, penalty: 25, penaltyTo: 'warkop' },
  W29: SKIP, W30: P(15), W31: P(10), W32: PW(10),
  W33: { type: 'DICE_OUTCOME', even: { receive: 20 }, odd: { pay: 5, to: 'bank' } },
  W34: P(5), W35: SKIP, W36: P(5),
  W37: { type: 'MOVE_STEPS', steps: -2 },
  W38: PW(10),
  W39: { type: 'PAY_TO_PLAYER', amount: 10, target: 'poorest' },
  W40: SKIP,
  W41: { type: 'MOVE_TO_NO_SALARY', tile: 0 },
  W42: P(5), W43: PW(15), W44: P(30),
  W45: { type: 'CLEAR_ARISAN' },
  W46: P(50),
  W47: { type: 'MOVE_STEPS', steps: -3 },
  W48: SKIP, W49: P(15), W50: PW(20),
};

function buildCards(): Card[] {
  return parseCards(md).map((c) => {
    const effect = EFFECTS[c.id];
    if (!effect) throw new Error(`Efek belum dipetakan: ${c.id}`);
    const n = Number(c.id.slice(1));
    return {
      id: c.id,
      deck: c.id.startsWith('N') ? 'nasib' : 'warga',
      side: n <= 25 ? 'kebaikan' : 'sindiran',
      tags: c.tags,
      title: c.title,
      text: c.text,
      effectText: c.effectText,
      effect,
    };
  });
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const tiles = buildTiles();
  const cards = buildCards();
  const out = (f: string, d: unknown) =>
    writeFileSync(resolve(root, 'src/data', f), JSON.stringify(d, null, 2) + '\n', 'utf8');
  out('tiles.json', tiles);
  out('cards.json', cards);
  out('groups.json', GROUPS);
  console.log(`OK: ${tiles.length} petak, ${cards.length} kartu, ${GROUPS.length} grup → src/data/`);
}
