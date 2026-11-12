// Engine aturan Juragan Nusantara — fungsi murni tanpa React.
// reduce(state, action) → state baru. Semua efek berantai dijalankan lewat antrean
// tugas (state.queue) sampai ada keputusan yang harus diambil pemain (state.prompt).

import { CARD_BY_ID, CONFIG, GROUP_BY_ID, TILES, TRANSPORT_INDEXES, UTILITY_INDEXES, groupMembers, isOwnable, ownable, PROPERTY_TILES } from './data.ts';
import { rp } from './format.ts';
import { nextRandom } from './rng.ts';
import type {
  Action,
  Card,
  CardEffect,
  CardOption,
  Creditor,
  DeckId,
  DiceMode,
  GameMode,
  GameState,
  ItemKind,
  LogEntry,
  PayTask,
  Player,
  Task,
  TradeOffer,
} from './types.ts';

export class GameError extends Error {}
function fail(msg: string): never {
  throw new GameError(msg);
}

const BOARD_SIZE = TILES.length;
const MAX_LOG = 300;

// ===================== Pembuatan permainan =====================

export interface NewPlayer {
  name: string;
  token: string;
  color: string;
}
export interface NewGameOptions {
  players: NewPlayer[];
  mode: GameMode;
  diceMode?: DiceMode;
  kilatRounds?: number | null;
  kilatMinutes?: number | null;
  seed: number;
  now?: number;
}

export function createGame(opts: NewGameOptions): GameState {
  if (opts.players.length < 2 || opts.players.length > 6) fail('Jumlah pemain harus 2–6.');
  const now = opts.now ?? 0;
  const s: GameState = {
    version: 1,
    mode: opts.mode,
    diceMode: opts.diceMode ?? 'digital',
    kilat:
      opts.mode === 'kilat'
        ? {
            maxRounds: opts.kilatRounds ?? null,
            endsAt: opts.kilatMinutes ? now + opts.kilatMinutes * 60_000 : null,
          }
        : null,
    players: opts.players.map((p, i) => ({
      id: `p${i + 1}`,
      name: p.name.trim() || `Pemain ${i + 1}`,
      token: p.token,
      color: p.color,
      cash: CONFIG.startMoney,
      position: 0,
      inJail: false,
      jailAttempts: 0,
      skipTurns: 0,
      doublesCount: 0,
      items: [],
      deferred: [],
      bankrupt: false,
      bankruptRound: null,
    })),
    current: 0,
    round: 1,
    phase: 'preRoll',
    resume: 'postRoll',
    prompt: null,
    queue: [],
    board: {},
    decks: { nasib: { draw: [], discard: [] }, warga: { draw: [], discard: [] } },
    warkop: 0,
    arisan: 0,
    bank: 0,
    lastDice: null,
    lastSingleDie: null,
    rolledDoubles: false,
    loans: [],
    rng: opts.seed | 0,
    log: [],
    logSeq: 0,
    moves: [],
    moveSeq: 0,
    lastCard: null,
    winner: null,
    endReason: null,
    startedAt: now,
    turnCount: 1,
  };
  for (const t of TILES) if (isOwnable(t)) s.board[t.index] = { owner: null, level: 0, mortgaged: false };
  for (const deck of ['nasib', 'warga'] as DeckId[]) {
    s.decks[deck].draw = shuffle(
      s,
      Object.values(CARD_BY_ID)
        .filter((c) => c.deck === deck)
        .map((c) => c.id),
    );
  }
  // Initial bank ledger: modal awal dibayar Bank.
  s.bank = -CONFIG.startMoney * s.players.length;
  log(s, `Permainan dimulai — Mode ${s.mode === 'kilat' ? 'Kilat' : 'Klasik'}, ${s.players.length} pemain. Modal awal ${rp(CONFIG.startMoney)}.`, 'info');

  if (s.mode === 'kilat') {
    const pool = shuffle(s, PROPERTY_TILES.map((t) => t.index));
    for (const p of s.players) {
      const got = pool.splice(0, CONFIG.kilat.startingProperties);
      for (const idx of got) s.board[idx].owner = p.id;
      log(s, `${p.name} mendapat properti awal: ${got.map((i) => TILES[i].short).join(' & ')}.`, 'info');
    }
  }
  log(s, `Giliran ${s.players[0].name}.`, 'info');
  return s;
}

// ===================== Utilitas umum =====================

function random(s: GameState): number {
  const [v, next] = nextRandom(s.rng);
  s.rng = next;
  return v;
}
export function rollDie(s: GameState): number {
  return 1 + Math.floor(random(s) * 6);
}
function shuffle<T>(s: GameState, arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function log(s: GameState, text: string, tone?: LogEntry['tone']) {
  s.logSeq += 1;
  s.log.push({ id: s.logSeq, round: s.round, text, tone });
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
}
export function getPlayer(s: GameState, id: string): Player {
  return s.players.find((p) => p.id === id) ?? fail(`Pemain ${id} tidak ditemukan`);
}
export const currentPlayer = (s: GameState) => s.players[s.current];
export const activePlayers = (s: GameState) => s.players.filter((p) => !p.bankrupt);
const nameOf = (s: GameState, id: string) => getPlayer(s, id).name;

function creditorName(s: GameState, c: Creditor): string {
  if (c === 'bank') return 'Bank';
  if (c === 'warkop') return 'Kas Warkop';
  if (c === 'arisan') return 'Kas Arisan';
  return nameOf(s, c.player);
}

/** Pindahkan uang. Sumber/tujuan: id pemain atau pos kas. Tidak memeriksa kecukupan dana. */
function transfer(s: GameState, from: string | Creditor, to: string | Creditor, amount: number) {
  if (amount <= 0) return;
  const take = (x: string | Creditor) => {
    if (x === 'bank') s.bank += -amount;
    else if (x === 'warkop') s.warkop -= amount;
    else if (x === 'arisan') s.arisan -= amount;
    else getPlayer(s, typeof x === 'string' ? x : x.player).cash -= amount;
  };
  const give = (x: string | Creditor) => {
    if (x === 'bank') s.bank += amount;
    else if (x === 'warkop') s.warkop += amount;
    else if (x === 'arisan') s.arisan += amount;
    else getPlayer(s, typeof x === 'string' ? x : x.player).cash += amount;
  };
  take(from);
  give(to);
}

function pushMove(s: GameState, player: string, from: number, to: number, mode: 'walk' | 'back' | 'jump') {
  s.moveSeq += 1;
  s.moves.push({ seq: s.moveSeq, player, from, to, mode });
  if (s.moves.length > 30) s.moves.splice(0, s.moves.length - 30);
}

/** Pemain aktif berurutan mulai dari pemain sekarang (untuk aturan seri). */
function orderFromCurrent(s: GameState): Player[] {
  const n = s.players.length;
  const out: Player[] = [];
  for (let i = 0; i < n; i++) {
    const p = s.players[(s.current + i) % n];
    if (!p.bankrupt) out.push(p);
  }
  return out;
}

function poorest(candidates: Player[]): Player {
  return candidates.reduce((min, p) => (p.cash < min.cash ? p : min), candidates[0]);
}

// ===================== Perhitungan (selector) =====================

export function ownsWholeGroup(s: GameState, owner: string, tileIndex: number): boolean {
  const t = TILES[tileIndex];
  if (t.kind !== 'property') return false;
  return groupMembers(t.group).every((i) => s.board[i].owner === owner);
}

export function calcRent(s: GameState, tileIndex: number, diceTotal: number): number {
  const t = ownable(tileIndex);
  const own = s.board[tileIndex];
  if (!own.owner || own.mortgaged) return 0;
  if (t.kind === 'property') {
    if (own.level === 0) return t.rent[0] * (ownsWholeGroup(s, own.owner, tileIndex) ? CONFIG.setRentMultiplier : 1);
    return t.rent[own.level];
  }
  if (t.kind === 'transport') {
    const n = TRANSPORT_INDEXES.filter((i) => s.board[i].owner === own.owner).length;
    return CONFIG.transportRent[n - 1];
  }
  const n = UTILITY_INDEXES.filter((i) => s.board[i].owner === own.owner).length;
  return diceTotal * CONFIG.utilityMultiplier[n - 1];
}

export const unmortgageCost = (tileIndex: number) => {
  // Hitung dengan bilangan bulat (persen) agar bebas galat floating-point: 200 × 10% = 20, bukan 20,000…03.
  const m = ownable(tileIndex).mortgage;
  return m + Math.ceil((m * Math.round(CONFIG.mortgageInterest * 100)) / 100);
};
export const sellValue = (tileIndex: number) => {
  const t = TILES[tileIndex];
  return t.kind === 'property' ? Math.floor(t.buildCost * CONFIG.buildingSellRatio) : 0;
};

export function ownedTiles(s: GameState, playerId: string): number[] {
  return Object.keys(s.board)
    .map(Number)
    .filter((i) => s.board[i].owner === playerId)
    .sort((a, b) => a - b);
}

/** Nilai satu properti untuk perhitungan aset: harga (bersih gadai) + biaya bangunan. */
export function tileAssetValue(s: GameState, i: number): number {
  const t = ownable(i);
  const o = s.board[i];
  const base = o.mortgaged ? t.price - t.mortgage : t.price;
  const build = t.kind === 'property' ? o.level * t.buildCost : 0;
  return base + build;
}

/** Total aset: uang + properti (bersih gadai) + bangunan. Dipakai untuk pajak 10%. */
export function totalAssets(s: GameState, playerId: string): number {
  const p = getPlayer(s, playerId);
  return p.cash + ownedTiles(s, playerId).reduce((sum, i) => sum + tileAssetValue(s, i), 0);
}

/** Kekayaan bersih (Mode Kilat): total aset ± utang-piutang & tanggungan. */
export function netWorth(s: GameState, playerId: string): number {
  const p = getPlayer(s, playerId);
  if (p.bankrupt) return 0;
  let w = totalAssets(s, playerId);
  for (const l of s.loans) {
    const due = loanDue(l.principal, l.interestPct);
    if (l.lender === playerId) w += due;
    if (l.borrower === playerId) w -= due;
  }
  w -= p.deferred.reduce((a, d) => a + d.amount, 0);
  return w;
}

export const loanDue = (principal: number, interestPct: number) => Math.round(principal * (1 + interestPct / 100));
export const loanPenaltyDue = (principal: number, interestPct: number) =>
  Math.round(loanDue(principal, interestPct) * (1 + CONFIG.loan.penaltyPct / 100));

/** Uang maksimal yang bisa dikumpulkan dengan menjual semua bangunan & menggadaikan semua properti. */
export function liquidationValue(s: GameState, playerId: string): number {
  let v = getPlayer(s, playerId).cash;
  for (const i of ownedTiles(s, playerId)) {
    const o = s.board[i];
    if (o.level > 0) v += o.level * sellValue(i);
    if (!o.mortgaged) v += ownable(i).mortgage;
  }
  return v;
}

export function canBuild(s: GameState, playerId: string, tileIndex: number, ignoreCash = false): boolean {
  const t = TILES[tileIndex];
  if (t.kind !== 'property') return false;
  const o = s.board[tileIndex];
  if (o.owner !== playerId || o.level >= 5) return false;
  const members = groupMembers(t.group);
  if (!members.every((i) => s.board[i].owner === playerId && !s.board[i].mortgaged)) return false;
  const minLevel = Math.min(...members.map((i) => s.board[i].level));
  if (o.level > minLevel) return false;
  return ignoreCash || getPlayer(s, playerId).cash >= t.buildCost;
}

export function canSellBuilding(s: GameState, playerId: string, tileIndex: number): boolean {
  const t = TILES[tileIndex];
  if (t.kind !== 'property') return false;
  const o = s.board[tileIndex];
  if (o.owner !== playerId || o.level === 0) return false;
  const maxLevel = Math.max(...groupMembers(t.group).map((i) => s.board[i].level));
  return o.level >= maxLevel;
}

export function canMortgage(s: GameState, playerId: string, tileIndex: number): boolean {
  const t = TILES[tileIndex];
  if (!isOwnable(t)) return false;
  const o = s.board[tileIndex];
  if (o.owner !== playerId || o.mortgaged) return false;
  if (t.kind === 'property') return groupMembers(t.group).every((i) => s.board[i].level === 0);
  return true;
}

export function canUnmortgage(s: GameState, playerId: string, tileIndex: number): boolean {
  const o = s.board[tileIndex];
  return !!o && o.owner === playerId && o.mortgaged && getPlayer(s, playerId).cash >= unmortgageCost(tileIndex);
}

/** Properti yang boleh diperdagangkan: tidak ada bangunan di grup warnanya. */
export function canTradeTile(s: GameState, playerId: string, tileIndex: number): boolean {
  const t = TILES[tileIndex];
  if (!isOwnable(t) || s.board[tileIndex].owner !== playerId) return false;
  if (t.kind === 'property') return groupMembers(t.group).every((i) => s.board[i].level === 0);
  return true;
}

/** Siapa yang sedang boleh mengelola aset (bangun/gadai/jual)? */
export function managingPlayer(s: GameState): string | null {
  if (s.phase === 'gameOver') return null;
  if (s.prompt?.type === 'debt') return s.prompt.player;
  if (s.prompt?.type === 'buy') return s.prompt.player;
  if (!s.prompt && (s.phase === 'preRoll' || s.phase === 'postRoll')) return currentPlayer(s).id;
  return null;
}

export function canEndTurn(s: GameState): boolean {
  if (s.phase !== 'postRoll' || s.prompt) return false;
  const p = currentPlayer(s);
  return !(s.rolledDoubles && !p.inJail && !p.bankrupt);
}

export function canRoll(s: GameState): boolean {
  if (s.prompt || s.phase === 'gameOver') return false;
  if (s.phase === 'preRoll') return true;
  const p = currentPlayer(s);
  return s.phase === 'postRoll' && s.rolledDoubles && !p.inJail && !p.bankrupt;
}

// ===================== Interpreter tugas =====================

function run(s: GameState) {
  while (s.phase === 'resolving' && !s.prompt) {
    const task = s.queue.shift();
    if (!task) {
      s.phase = s.resume;
      s.resume = 'postRoll';
      if (currentPlayer(s).bankrupt) {
        s.phase = 'postRoll';
        s.rolledDoubles = false;
        if (!checkGameOver(s)) advanceTurn(s);
      }
      return;
    }
    execTask(s, task);
    if (checkGameOver(s)) return;
  }
}

function startResolving(s: GameState, tasks: Task[], resume: 'preRoll' | 'postRoll' = 'postRoll') {
  s.phase = 'resolving';
  s.resume = resume;
  s.queue.unshift(...tasks);
  run(s);
}

function execTask(s: GameState, task: Task) {
  switch (task.t) {
    case 'pay':
      return execPay(s, task);
    case 'receive':
      transfer(s, 'bank', task.player, task.amount);
      log(s, `${nameOf(s, task.player)} menerima ${rp(task.amount)} — ${task.reason}.`, 'good');
      return;
    case 'move':
      return execMove(s, task.player, task.steps);
    case 'moveTo':
      return execMoveTo(s, task.player, task.tile, task.salary, task.rentMultiplier);
    case 'land':
      return execLand(s, task.player, task.rentMultiplier ?? 1);
    case 'goToJail':
      return sendToJail(s, task.player, task.reason);
    case 'draw':
      return execDraw(s, task.player, task.deck);
    case 'effect':
      return applyEffect(s, task.player, CARD_BY_ID[task.cardId]);
    case 'releaseCard':
      return returnCardToDeckBottom(s, task.cardId);
    case 'leaveJail': {
      const p = getPlayer(s, task.player);
      p.inJail = false;
      p.jailAttempts = 0;
      return;
    }
  }
}

function execPay(s: GameState, task: PayTask) {
  const payer = getPlayer(s, task.from);
  if (payer.bankrupt) return;
  if (typeof task.to === 'object' && getPlayer(s, task.to.player).bankrupt) return;
  if (payer.cash >= task.amount) {
    transfer(s, payer.id, task.to, task.amount);
    log(s, `${payer.name} membayar ${rp(task.amount)} ke ${creditorName(s, task.to)} — ${task.reason}.`, 'bad');
    if (task.loanId) {
      s.loans = s.loans.filter((l) => l.id !== task.loanId);
      log(s, `Utang ${payer.name} lunas.`, 'info');
    }
    return;
  }
  // Uang tidak cukup: tugas tetap di depan antrean, pemain harus mencari dana.
  s.queue.unshift(task);
  s.prompt = {
    type: 'debt',
    player: payer.id,
    amount: task.amount,
    to: task.to,
    reason: task.reason,
    allowSurrender: !!task.loanId,
  };
  log(s, `${payer.name} kurang uang untuk membayar ${rp(task.amount)} (${task.reason}). Jual bangunan atau gadai properti!`, 'bad');
}

function paySalary(s: GameState, playerId: string) {
  const p = getPlayer(s, playerId);
  transfer(s, 'bank', p.id, CONFIG.salary);
  transfer(s, p.id, 'arisan', CONFIG.arisanFee);
  log(s, `${p.name} lewat MULAI: gajian ${rp(CONFIG.salary)}, setor iuran arisan ${rp(CONFIG.arisanFee)}.`, 'good');
  // Efek tertunda (contoh: N50 pinjol) ditagih saat lewat MULAI.
  const due = p.deferred.splice(0);
  const tasks: PayTask[] = due.map((d) => ({
    t: 'pay',
    from: p.id,
    to: 'bank',
    amount: d.amount,
    reason: `tagihan tertunda ${CARD_BY_ID[d.cardId]?.title ?? d.cardId}`,
  }));
  return tasks;
}

function execMove(s: GameState, playerId: string, steps: number) {
  const p = getPlayer(s, playerId);
  const from = p.position;
  const raw = from + steps;
  const to = ((raw % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
  p.position = to;
  pushMove(s, p.id, from, to, steps >= 0 ? 'walk' : 'back');
  const extra: Task[] = [];
  if (steps > 0 && raw >= BOARD_SIZE) extra.push(...paySalary(s, p.id));
  if (steps < 0) log(s, `${p.name} mundur ${-steps} petak ke ${TILES[to].short}.`, 'info');
  else log(s, `${p.name} maju ${steps} petak ke ${TILES[to].short}.`, 'info');
  s.queue.unshift(...extra, { t: 'land', player: p.id });
}

function execMoveTo(s: GameState, playerId: string, tile: number, salary: boolean, rentMultiplier?: number) {
  const p = getPlayer(s, playerId);
  const from = p.position;
  p.position = tile;
  const passes = salary && tile <= from && tile !== from;
  pushMove(s, p.id, from, tile, salary ? 'walk' : 'jump');
  log(s, `${p.name} pindah ke ${TILES[tile].short}.`, 'info');
  const extra: Task[] = passes ? paySalary(s, p.id) : [];
  s.queue.unshift(...extra, { t: 'land', player: p.id, rentMultiplier });
}

function sendToJail(s: GameState, playerId: string, reason: string) {
  const p = getPlayer(s, playerId);
  const from = p.position;
  p.position = CONFIG.jail.tile;
  p.inJail = true;
  p.jailAttempts = 0;
  p.doublesCount = 0;
  if (playerId === currentPlayer(s).id) s.rolledDoubles = false;
  pushMove(s, p.id, from, CONFIG.jail.tile, 'jump');
  log(s, `${p.name} masuk Hotel Prodeo — ${reason}.`, 'bad');
}

function execLand(s: GameState, playerId: string, rentMultiplier: number) {
  const p = getPlayer(s, playerId);
  const tile = TILES[p.position];
  switch (tile.kind) {
    case 'property':
    case 'transport':
    case 'utility': {
      const o = s.board[tile.index];
      if (!o.owner) {
        s.prompt = { type: 'buy', player: p.id, tile: tile.index };
        return;
      }
      if (o.owner === p.id) return;
      if (o.mortgaged) {
        log(s, `${tile.short} sedang digadaikan, ${p.name} tidak perlu bayar sewa.`, 'info');
        return;
      }
      const dice = s.lastDice ? s.lastDice[0] + s.lastDice[1] : 7;
      const rent = calcRent(s, tile.index, dice) * rentMultiplier;
      if (rent > 0)
        s.queue.unshift({
          t: 'pay',
          from: p.id,
          to: { player: o.owner },
          amount: rent,
          reason: `sewa ${tile.short}${rentMultiplier > 1 ? ` (${rentMultiplier}×)` : ''}`,
        });
      return;
    }
    case 'tax':
      if (tile.percent) {
        s.prompt = {
          type: 'incomeTax',
          player: p.id,
          flat: tile.amount,
          percentAmount: Math.round((totalAssets(s, p.id) * tile.percent) / 100),
        };
      } else {
        s.queue.unshift({ t: 'pay', from: p.id, to: 'bank', amount: tile.amount, reason: tile.short });
      }
      return;
    case 'card':
      s.queue.unshift({ t: 'draw', player: p.id, deck: tile.deck });
      return;
    case 'goToJail':
      return sendToJail(s, p.id, 'KENA OTT!');
    case 'warkop': {
      const amt = s.warkop;
      if (amt > 0) {
        transfer(s, 'warkop', p.id, amt);
        log(s, `${p.name} ngopi di Warkop dan mengambil seluruh Kas Warkop: ${rp(amt)}!`, 'good');
      } else log(s, `${p.name} ngopi di Warkop. Kas Warkop sedang kosong.`, 'info');
      return;
    }
    case 'pungli':
      s.prompt = { type: 'pungli', player: p.id };
      return;
    case 'start':
    case 'jail':
      return;
  }
}

function execDraw(s: GameState, playerId: string, deck: DeckId) {
  const d = s.decks[deck];
  if (d.draw.length === 0) {
    d.draw = shuffle(s, d.discard);
    d.discard = [];
    log(s, `Dek Kartu ${deck === 'nasib' ? 'Nasib' : 'Warga'} habis, dikocok ulang.`, 'info');
  }
  const cardId = d.draw.shift();
  if (!cardId) {
    log(s, `Dek Kartu ${deck === 'nasib' ? 'Nasib' : 'Warga'} kosong (semua kartu sedang dipegang).`, 'info');
    return;
  }
  const card = CARD_BY_ID[cardId];
  const p = getPlayer(s, playerId);
  const options: CardOption[] = [];
  if (card.tags.includes('bencana') && p.items.some((i) => i.kind === 'disaster_shield')) options.push('shield', 'ok');
  else if (card.effect.type === 'SKIP_OR_PAY') options.push('skip', 'pay');
  else if (card.effect.type === 'DICE_OUTCOME') options.push('roll');
  else options.push('ok');
  s.lastCard = { cardId, player: playerId, seq: s.logSeq + 1 };
  s.prompt = { type: 'card', player: playerId, cardId, options };
  log(s, `${p.name} mengambil Kartu ${deck === 'nasib' ? 'Nasib' : 'Warga'}: "${card.title}".`, 'card');
}

function discardCard(s: GameState, cardId: string) {
  const c = CARD_BY_ID[cardId];
  s.decks[c.deck].discard.push(cardId);
}
function returnCardToDeckBottom(s: GameState, cardId: string) {
  const c = CARD_BY_ID[cardId];
  s.decks[c.deck].draw.push(cardId);
}

function useItem(s: GameState, playerId: string, kind: ItemKind): boolean {
  const p = getPlayer(s, playerId);
  const idx = p.items.findIndex((i) => i.kind === kind);
  if (idx < 0) return false;
  const [item] = p.items.splice(idx, 1);
  returnCardToDeckBottom(s, item.cardId);
  return true;
}

function applyEffect(s: GameState, playerId: string, card: Card) {
  const e: CardEffect = card.effect;
  const p = getPlayer(s, playerId);
  const reason = card.title;
  const pay = (amount: number, to: Creditor = 'bank'): PayTask => ({ t: 'pay', from: p.id, to, amount, reason });
  switch (e.type) {
    case 'RECEIVE':
      s.queue.unshift({ t: 'receive', player: p.id, amount: e.amount, reason });
      return;
    case 'PAY':
      s.queue.unshift(pay(e.amount));
      return;
    case 'PAY_WARKOP':
      s.queue.unshift(pay(e.amount, 'warkop'));
      return;
    case 'RECEIVE_FROM_ALL':
      s.queue.unshift(
        ...orderFromCurrent(s)
          .filter((q) => q.id !== p.id)
          .map((q): PayTask => ({ t: 'pay', from: q.id, to: { player: p.id }, amount: e.amount, reason })),
      );
      return;
    case 'ALL_RECEIVE':
      s.queue.unshift(...orderFromCurrent(s).map((q): Task => ({ t: 'receive', player: q.id, amount: e.amount, reason })));
      return;
    case 'PAY_TO_PLAYER': {
      const others = orderFromCurrent(s).filter((q) => q.id !== p.id);
      if (others.length === 0) return;
      const target = e.target === 'left' ? others[0] : poorest(others);
      s.queue.unshift(pay(e.amount, { player: target.id }));
      return;
    }
    case 'POOREST_RECEIVE_FROM_ALL': {
      const order = orderFromCurrent(s);
      const poor = poorest(order);
      log(s, `Pemain dengan uang paling sedikit: ${poor.name}.`, 'info');
      s.queue.unshift(
        ...order
          .filter((q) => q.id !== poor.id)
          .map((q): PayTask => ({ t: 'pay', from: q.id, to: { player: poor.id }, amount: e.amount, reason })),
      );
      return;
    }
    case 'TAKE_ARISAN': {
      const amt = s.arisan;
      transfer(s, 'arisan', p.id, amt);
      log(s, `${p.name} narik arisan: ${rp(amt)}!`, 'good');
      return;
    }
    case 'CLEAR_ARISAN': {
      const amt = s.arisan;
      transfer(s, 'arisan', 'bank', amt);
      log(s, `Kas Arisan ${rp(amt)} hangus dibawa kabur bandar.`, 'bad');
      return;
    }
    case 'MOVE_TO':
      s.queue.unshift({ t: 'moveTo', player: p.id, tile: e.tile, salary: true });
      return;
    case 'MOVE_TO_NO_SALARY':
      s.queue.unshift({ t: 'moveTo', player: p.id, tile: e.tile, salary: false });
      return;
    case 'MOVE_TO_NEAREST_TRANSPORT': {
      const next = TRANSPORT_INDEXES.find((i) => i > p.position) ?? TRANSPORT_INDEXES[0];
      s.queue.unshift({ t: 'moveTo', player: p.id, tile: next, salary: true, rentMultiplier: e.rentMultiplier });
      return;
    }
    case 'MOVE_STEPS': {
      const tasks: Task[] = [];
      if (e.alsoPay) tasks.push(pay(e.alsoPay.amount, e.alsoPay.to));
      tasks.push({ t: 'move', player: p.id, steps: e.steps });
      s.queue.unshift(...tasks);
      return;
    }
    case 'SKIP_TURN':
      p.skipTurns += 1;
      log(s, `${p.name} harus diam 1 giliran berikutnya.`, 'bad');
      return;
    case 'SKIP_OR_PAY':
      // Ditangani lewat pilihan kartu (skip / pay).
      return;
    case 'GO_TO_JAIL':
      s.queue.unshift({ t: 'goToJail', player: p.id, reason: card.title });
      return;
    case 'KEEP_ITEM':
      p.items.push({ cardId: card.id, kind: e.item });
      log(s, `${p.name} menyimpan kartu "${card.title}".`, 'good');
      return;
    case 'PAY_PER_BUILDING': {
      let homestay = 0;
      let resort = 0;
      for (const i of ownedTiles(s, p.id)) {
        const lv = s.board[i].level;
        if (lv === 5) resort += 1;
        else homestay += lv;
      }
      const total = homestay * e.perHomestay + resort * e.perResort;
      if (total === 0) log(s, `${p.name} belum punya bangunan, jadi tidak ada kerugian.`, 'info');
      else s.queue.unshift(pay(total, e.to));
      return;
    }
    case 'FREE_BUILDING': {
      const tiles = ownedTiles(s, p.id).filter((i) => canBuild(s, p.id, i, true));
      if (tiles.length === 0) {
        s.queue.unshift({ t: 'receive', player: p.id, amount: e.fallbackAmount, reason });
        return;
      }
      s.prompt = { type: 'freeBuilding', player: p.id, tiles };
      return;
    }
    case 'DICE_OUTCOME':
      return; // ditangani lewat pilihan 'roll'
    case 'CONDITIONAL_WEALTH':
      if (p.cash > e.threshold) {
        log(s, `Uang ${p.name} di atas ${rp(e.threshold)} — bansos dikembalikan dan kena denda malu.`, 'bad');
        s.queue.unshift(pay(e.penalty, e.penaltyTo));
      } else s.queue.unshift({ t: 'receive', player: p.id, amount: e.receive, reason });
      return;
    case 'DEFERRED_PAY':
      s.queue.unshift({ t: 'receive', player: p.id, amount: e.receive, reason });
      p.deferred.push({ id: `d${s.logSeq}`, cardId: card.id, amount: e.pay });
      log(s, `Tanggungan baru: ${p.name} wajib bayar ${rp(e.pay)} saat lewat MULAI berikutnya.`, 'bad');
      return;
  }
}

// ===================== Bangkrut, giliran, akhir permainan =====================

function bankrupt(s: GameState, debtorId: string, creditor: Creditor) {
  const d = getPlayer(s, debtorId);
  // Jual semua bangunan ke Bank setengah harga.
  for (const i of ownedTiles(s, d.id)) {
    const o = s.board[i];
    if (o.level > 0) {
      transfer(s, 'bank', d.id, o.level * sellValue(i));
      o.level = 0;
    }
  }
  const cash = d.cash;
  if (typeof creditor === 'object') {
    const c = getPlayer(s, creditor.player);
    transfer(s, d.id, c.id, cash);
    for (const i of ownedTiles(s, d.id)) s.board[i].owner = c.id;
    c.items.push(...d.items);
  } else {
    transfer(s, d.id, creditor, cash);
    for (const i of ownedTiles(s, d.id)) s.board[i] = { owner: null, level: 0, mortgaged: false };
    for (const it of d.items) returnCardToDeckBottom(s, it.cardId);
  }
  d.items = [];
  d.deferred = [];
  d.bankrupt = true;
  d.bankruptRound = s.round;
  d.inJail = false;
  s.loans = s.loans.filter((l) => l.lender !== d.id && l.borrower !== d.id);
  // Buang tugas yang tersisa milik pemain yang bangkrut.
  if (d.id === currentPlayer(s).id) {
    s.queue = s.queue.filter((t) => t.t === 'pay' && t.from !== d.id && !(typeof t.to === 'object' && t.to.player === d.id));
    s.rolledDoubles = false;
  } else {
    s.queue = s.queue.filter((t) => !(t.t === 'pay' && t.from === d.id));
  }
  log(s, `💥 ${d.name} BANGKRUT! Aset diserahkan ke ${creditorName(s, creditor)}.`, 'bad');
}

function checkGameOver(s: GameState): boolean {
  if (s.phase === 'gameOver') return true;
  const alive = activePlayers(s);
  if (alive.length <= 1) {
    finishGame(s, alive.length === 1 ? `Semua lawan bangkrut.` : 'Semua pemain bangkrut.');
    return true;
  }
  return false;
}

export function ranking(s: GameState): { player: Player; worth: number }[] {
  return [...s.players]
    .map((p) => ({ player: p, worth: netWorth(s, p.id) }))
    .sort((a, b) => {
      if (a.player.bankrupt !== b.player.bankrupt) return a.player.bankrupt ? 1 : -1;
      if (a.player.bankrupt && b.player.bankrupt) return (b.player.bankruptRound ?? 0) - (a.player.bankruptRound ?? 0);
      return b.worth - a.worth;
    });
}

function finishGame(s: GameState, reason: string) {
  s.phase = 'gameOver';
  s.prompt = null;
  s.queue = [];
  const [top] = ranking(s);
  s.winner = top.player.id;
  s.endReason = reason;
  log(s, `🏆 Permainan selesai (${reason}). Juragan Nusantara: ${top.player.name}!`, 'good');
}

function advanceTurn(s: GameState) {
  const n = s.players.length;
  let idx = s.current;
  for (let guard = 0; guard < n * 10; guard++) {
    const next = (idx + 1) % n;
    if (next <= idx) {
      s.round += 1;
      if (s.kilat?.maxRounds && s.round > s.kilat.maxRounds) {
        s.round = s.kilat.maxRounds;
        finishGame(s, `batas ${s.kilat.maxRounds} putaran tercapai`);
        return;
      }
    }
    idx = next;
    const p = s.players[idx];
    if (p.bankrupt) continue;
    if (p.skipTurns > 0) {
      p.skipTurns -= 1;
      log(s, `${p.name} melewatkan giliran (diam 1 giliran).`, 'info');
      continue;
    }
    break;
  }
  s.current = idx;
  s.turnCount += 1;
  const p = currentPlayer(s);
  p.doublesCount = 0;
  s.rolledDoubles = false;
  s.lastDice = null;
  s.phase = 'preRoll';
  s.prompt = null;
  log(s, `Giliran ${p.name}${p.inJail ? ' (di Hotel Prodeo)' : ''}.`, 'info');
  // Utang antarpemain yang jatuh tempo ditagih "di grup chat RT".
  const due = s.loans.filter((l) => l.borrower === p.id && s.round >= l.dueRound);
  if (due.length) {
    for (const l of due) log(s, `📱 Utang ${p.name} ke ${nameOf(s, l.lender)} ditagih di grup chat RT (+denda ${CONFIG.loan.penaltyPct}%)!`, 'bad');
    startResolving(
      s,
      due.map(
        (l): PayTask => ({
          t: 'pay',
          from: p.id,
          to: { player: l.lender },
          amount: loanPenaltyDue(l.principal, l.interestPct),
          reason: 'utang jatuh tempo',
          loanId: l.id,
        }),
      ),
      'preRoll',
    );
  }
}

// ===================== Reducer =====================

export function reduce(state: GameState, action: Action): GameState {
  if (state.phase === 'gameOver') fail('Permainan sudah selesai.');
  const s: GameState = structuredClone(state);
  handle(s, action);
  return s;
}

function requirePrompt<T extends NonNullable<GameState['prompt']>['type']>(s: GameState, type: T) {
  const p = s.prompt;
  if (!p || p.type !== type) fail(`Aksi tidak sesuai situasi (butuh ${type}).`);
  return p as Extract<NonNullable<GameState['prompt']>, { type: T }>;
}

function validDie(d: number | undefined): number | undefined {
  if (d === undefined) return undefined;
  if (!Number.isInteger(d) || d < 1 || d > 6) fail('Angka dadu harus 1–6.');
  return d;
}

function resolvePromptAndRun(s: GameState, tasks: Task[] = []) {
  s.prompt = null;
  s.queue.unshift(...tasks);
  run(s);
}

function handle(s: GameState, a: Action) {
  const me = currentPlayer(s);
  switch (a.type) {
    case 'ROLL': {
      if (!canRoll(s)) fail('Belum saatnya melempar dadu.');
      const d1 = validDie(a.dice?.[0]) ?? rollDie(s);
      const d2 = validDie(a.dice?.[1]) ?? rollDie(s);
      s.lastDice = [d1, d2];
      const doubles = d1 === d2;
      const total = d1 + d2;
      log(s, `🎲 ${me.name} melempar ${d1} + ${d2} = ${total}${doubles ? ' (DOBEL!)' : ''}.`, 'info');
      if (me.inJail) {
        if (doubles) {
          me.inJail = false;
          me.jailAttempts = 0;
          s.rolledDoubles = false;
          log(s, `${me.name} keluar dari Hotel Prodeo berkat dadu dobel.`, 'good');
          return startResolving(s, [{ t: 'move', player: me.id, steps: total }]);
        }
        me.jailAttempts += 1;
        if (me.jailAttempts >= CONFIG.jail.maxAttempts) {
          log(s, `${me.name} gagal dobel ${CONFIG.jail.maxAttempts} kali, wajib bayar denda.`, 'bad');
          return startResolving(s, [
            { t: 'pay', from: me.id, to: CONFIG.jail.fineTo, amount: CONFIG.jail.fine, reason: 'denda Hotel Prodeo' },
            { t: 'leaveJail', player: me.id },
            { t: 'move', player: me.id, steps: total },
          ]);
        }
        log(s, `${me.name} belum dobel, tetap di Hotel Prodeo (percobaan ${me.jailAttempts}/${CONFIG.jail.maxAttempts}).`, 'info');
        s.rolledDoubles = false;
        s.phase = 'postRoll';
        return;
      }
      if (doubles) {
        me.doublesCount += 1;
        if (me.doublesCount >= 3) {
          return startResolving(s, [{ t: 'goToJail', player: me.id, reason: 'dobel 3 kali berturut-turut, "Ngebut terus, dicurigai."' }]);
        }
      }
      s.rolledDoubles = doubles;
      return startResolving(s, [{ t: 'move', player: me.id, steps: total }]);
    }

    case 'BUY': {
      const pr = requirePrompt(s, 'buy');
      const t = ownable(pr.tile);
      const p = getPlayer(s, pr.player);
      if (p.cash < t.price) fail('Uang tidak cukup untuk membeli.');
      transfer(s, p.id, 'bank', t.price);
      s.board[pr.tile].owner = p.id;
      log(s, `${p.name} membeli ${t.short} seharga ${rp(t.price)}.`, 'good');
      return resolvePromptAndRun(s);
    }

    case 'DECLINE_BUY': {
      const pr = requirePrompt(s, 'buy');
      const t = ownable(pr.tile);
      log(s, `${nameOf(s, pr.player)} tidak membeli ${t.short}. Lelang Pasar Tradisional dimulai dari ${rp(CONFIG.auction.startBid)}!`, 'info');
      s.prompt = { type: 'auction', tile: pr.tile, highBid: 0, highBidder: null, bidders: orderFromCurrent(s).map((p) => p.id), turn: 0 };
      return;
    }

    case 'BID': {
      const pr = requirePrompt(s, 'auction');
      if (pr.bidders[pr.turn] !== a.player) fail('Bukan giliran pemain ini menawar.');
      const min = Math.max(CONFIG.auction.startBid, pr.highBid + 1);
      if (!Number.isInteger(a.amount) || a.amount < min) fail(`Tawaran minimal ${rp(min)}.`);
      if (getPlayer(s, a.player).cash < a.amount) fail('Uang tidak cukup untuk tawaran ini.');
      pr.highBid = a.amount;
      pr.highBidder = a.player;
      log(s, `${nameOf(s, a.player)} menawar ${rp(a.amount)}.`, 'info');
      pr.turn = (pr.turn + 1) % pr.bidders.length;
      return settleAuction(s);
    }

    case 'PASS_BID': {
      const pr = requirePrompt(s, 'auction');
      if (pr.bidders[pr.turn] !== a.player) fail('Bukan giliran pemain ini.');
      pr.bidders.splice(pr.turn, 1);
      log(s, `${nameOf(s, a.player)} mundur dari lelang.`, 'info');
      if (pr.bidders.length) pr.turn = pr.turn % pr.bidders.length;
      return settleAuction(s);
    }

    case 'CARD_CHOICE': {
      const pr = requirePrompt(s, 'card');
      if (!pr.options.includes(a.option)) fail('Pilihan kartu tidak tersedia.');
      const card = CARD_BY_ID[pr.cardId];
      const p = getPlayer(s, pr.player);
      const isItem = card.effect.type === 'KEEP_ITEM';
      if (!isItem) discardCard(s, card.id);
      switch (a.option) {
        case 'shield':
          useItem(s, p.id, 'disaster_shield');
          log(s, `${p.name} memakai Asuransi Bencana — efek "${card.title}" dibatalkan.`, 'good');
          return resolvePromptAndRun(s);
        case 'skip':
          p.skipTurns += 1;
          log(s, `${p.name} memilih diam 1 giliran.`, 'info');
          return resolvePromptAndRun(s);
        case 'pay': {
          const e = card.effect as Extract<CardEffect, { type: 'SKIP_OR_PAY' }>;
          if (p.cash < e.amount) fail('Uang tidak cukup.');
          return resolvePromptAndRun(s, [{ t: 'pay', from: p.id, to: e.to, amount: e.amount, reason: card.title }]);
        }
        case 'roll': {
          const e = card.effect as Extract<CardEffect, { type: 'DICE_OUTCOME' }>;
          const die = validDie(a.die) ?? rollDie(s);
          s.lastSingleDie = die;
          log(s, `🎲 ${p.name} melempar 1 dadu: ${die} (${die % 2 === 0 ? 'genap' : 'ganjil'}).`, 'info');
          return resolvePromptAndRun(
            s,
            die % 2 === 0
              ? [{ t: 'receive', player: p.id, amount: e.even.receive, reason: `${card.title} — viral, langsung diperbaiki` }]
              : [{ t: 'pay', from: p.id, to: e.odd.to, amount: e.odd.pay, reason: `${card.title} — tetap diabaikan` }],
          );
        }
        case 'ok':
          return resolvePromptAndRun(s, [{ t: 'effect', player: p.id, cardId: card.id }]);
      }
      return;
    }

    case 'INCOME_TAX': {
      const pr = requirePrompt(s, 'incomeTax');
      const amount = a.choice === 'flat' ? pr.flat : pr.percentAmount;
      return resolvePromptAndRun(s, [
        { t: 'pay', from: pr.player, to: 'bank', amount, reason: `Pajak Penghasilan (${a.choice === 'flat' ? 'tarif tetap' : '10% aset'})` },
      ]);
    }

    case 'PUNGLI': {
      const pr = requirePrompt(s, 'pungli');
      const p = getPlayer(s, pr.player);
      if (a.choice === 'orang_dalam') {
        if (!useItem(s, p.id, 'orang_dalam')) fail('Tidak punya Kartu Orang Dalam.');
        log(s, `${p.name}: "Tenang, saya kenal orangnya." Lolos Pos Pungli tanpa bayar.`, 'good');
        return resolvePromptAndRun(s);
      }
      if (a.choice === 'pay')
        return resolvePromptAndRun(s, [{ t: 'pay', from: p.id, to: CONFIG.pungli.to, amount: CONFIG.pungli.flat, reason: 'uang rokok Pos Pungli' }]);
      const die = validDie(a.die) ?? rollDie(s);
      s.lastSingleDie = die;
      const { low, mid, high } = CONFIG.pungli.nego;
      const [amount, msg] = die <= 2 ? [low, 'Petugas tersinggung.'] : die <= 4 ? [mid, 'Ya sudah, tarif normal.'] : [high, 'Petugasnya lagi baik hati.'];
      log(s, `🎲 ${p.name} nego di Pos Pungli, dadu ${die}: "${msg}"`, amount ? 'bad' : 'good');
      return resolvePromptAndRun(
        s,
        amount ? [{ t: 'pay', from: p.id, to: CONFIG.pungli.to, amount, reason: 'nego Pos Pungli' }] : [],
      );
    }

    case 'FREE_BUILDING': {
      const pr = requirePrompt(s, 'freeBuilding');
      if (!pr.tiles.includes(a.tile)) fail('Petak tidak valid untuk bangunan gratis.');
      s.board[a.tile].level += 1;
      log(s, `Warga bergotong royong: ${nameOf(s, pr.player)} mendapat 1 Homestay gratis di ${TILES[a.tile].short}.`, 'good');
      return resolvePromptAndRun(s);
    }

    case 'JAIL_PAY': {
      if (s.phase !== 'preRoll' || s.prompt || !me.inJail) fail('Tidak sedang di Hotel Prodeo.');
      if (me.cash < CONFIG.jail.fine) fail('Uang tidak cukup untuk membayar denda.');
      transfer(s, me.id, CONFIG.jail.fineTo, CONFIG.jail.fine);
      me.inJail = false;
      me.jailAttempts = 0;
      log(s, `${me.name} membayar denda ${rp(CONFIG.jail.fine)} ke Kas Warkop dan keluar dari Hotel Prodeo.`, 'info');
      return;
    }

    case 'JAIL_USE_ITEM': {
      if (s.phase !== 'preRoll' || s.prompt || !me.inJail) fail('Tidak sedang di Hotel Prodeo.');
      if (!useItem(s, me.id, a.item)) fail('Kartu tidak dimiliki.');
      me.inJail = false;
      me.jailAttempts = 0;
      log(s, `${me.name} keluar dari Hotel Prodeo memakai ${a.item === 'jail_free' ? 'Remisi 17 Agustus' : 'Kartu Orang Dalam'}.`, 'good');
      return;
    }

    case 'BUILD': {
      const who = managingPlayer(s);
      if (!who || s.prompt?.type === 'debt') fail('Tidak bisa membangun sekarang.');
      if (!canBuild(s, who!, a.tile)) fail('Tidak memenuhi syarat membangun (grup lengkap, merata, tidak digadai, uang cukup).');
      const t = TILES[a.tile] as Extract<(typeof TILES)[number], { kind: 'property' }>;
      transfer(s, who!, 'bank', t.buildCost);
      s.board[a.tile].level += 1;
      log(s, `${nameOf(s, who!)} membangun ${s.board[a.tile].level === 5 ? 'Resort' : 'Homestay'} di ${t.short} (${rp(t.buildCost)}).`, 'good');
      return;
    }

    case 'SELL_BUILDING': {
      const who = managingPlayer(s);
      if (!who || !canSellBuilding(s, who, a.tile)) fail('Tidak bisa menjual bangunan ini (harus merata).');
      const v = sellValue(a.tile);
      s.board[a.tile].level -= 1;
      transfer(s, 'bank', who!, v);
      log(s, `${nameOf(s, who!)} menjual 1 bangunan di ${TILES[a.tile].short} seharga ${rp(v)}.`, 'info');
      return;
    }

    case 'MORTGAGE': {
      const who = managingPlayer(s);
      if (!who || !canMortgage(s, who, a.tile)) fail('Tidak bisa menggadaikan (jual bangunan di grup ini dulu).');
      const t = ownable(a.tile);
      s.board[a.tile].mortgaged = true;
      transfer(s, 'bank', who!, t.mortgage);
      log(s, `${nameOf(s, who!)} menggadaikan ${t.short} dan menerima ${rp(t.mortgage)}.`, 'info');
      return;
    }

    case 'UNMORTGAGE': {
      const who = managingPlayer(s);
      if (!who || s.prompt?.type === 'debt' || !canUnmortgage(s, who, a.tile)) fail('Tidak bisa menebus sekarang.');
      const cost = unmortgageCost(a.tile);
      s.board[a.tile].mortgaged = false;
      transfer(s, who!, 'bank', cost);
      log(s, `${nameOf(s, who!)} menebus ${TILES[a.tile].short} seharga ${rp(cost)}.`, 'info');
      return;
    }

    case 'AUTO_LIQUIDATE': {
      const pr = requirePrompt(s, 'debt');
      autoLiquidate(s, pr.player, pr.amount);
      return;
    }

    case 'PAY_DEBT': {
      const pr = requirePrompt(s, 'debt');
      if (getPlayer(s, pr.player).cash < pr.amount) fail('Uang masih belum cukup.');
      return resolvePromptAndRun(s); // tugas bayar masih di depan antrean
    }

    case 'SURRENDER_PROPERTY': {
      const pr = requirePrompt(s, 'debt');
      if (!pr.allowSurrender || typeof pr.to !== 'object') fail('Penyerahan properti hanya untuk utang antarpemain.');
      if (s.board[a.tile]?.owner !== pr.player) fail('Properti bukan milik pemain ini.');
      const value = tileAssetValue(s, a.tile);
      s.board[a.tile].owner = pr.to.player;
      const task = s.queue[0] as PayTask;
      task.amount = Math.max(0, task.amount - value);
      pr.amount = task.amount;
      log(s, `${nameOf(s, pr.player)} menyerahkan ${TILES[a.tile].short} (nilai ${rp(value)}) ke ${nameOf(s, pr.to.player)}.`, 'bad');
      if (task.amount === 0) {
        s.queue.shift();
        if (task.loanId) s.loans = s.loans.filter((l) => l.id !== task.loanId);
        log(s, `Utang ${nameOf(s, pr.player)} dianggap lunas.`, 'info');
        return resolvePromptAndRun(s);
      }
      return;
    }

    case 'DECLARE_BANKRUPTCY': {
      const pr = requirePrompt(s, 'debt');
      if (liquidationValue(s, pr.player) >= pr.amount) fail('Masih bisa membayar dengan menjual bangunan atau menggadaikan properti.');
      s.queue.shift(); // tugas bayar yang gagal
      s.prompt = null;
      bankrupt(s, pr.player, pr.to);
      if (checkGameOver(s)) return;
      run(s);
      return;
    }

    case 'TRADE':
      return doTrade(s, a.a, a.b, a.aGives, a.bGives);

    case 'LOAN': {
      if (s.prompt || (s.phase !== 'preRoll' && s.phase !== 'postRoll')) fail('Pinjam-meminjam hanya di luar proses giliran.');
      const lender = getPlayer(s, a.lender);
      const borrower = getPlayer(s, a.borrower);
      if (lender.id === borrower.id || lender.bankrupt || borrower.bankrupt) fail('Pemain tidak valid.');
      if (!Number.isInteger(a.principal) || a.principal <= 0) fail('Jumlah pinjaman tidak valid.');
      if (a.interestPct < 0 || a.interestPct > CONFIG.loan.maxInterestPct) fail(`Bunga maksimal ${CONFIG.loan.maxInterestPct}%.`);
      if (lender.cash < a.principal) fail('Uang pemberi pinjaman tidak cukup.');
      transfer(s, lender.id, borrower.id, a.principal);
      s.loans.push({
        id: `L${s.logSeq + 1}`,
        lender: lender.id,
        borrower: borrower.id,
        principal: a.principal,
        interestPct: a.interestPct,
        createdRound: s.round,
        dueRound: s.round + CONFIG.loan.dueRounds,
      });
      log(
        s,
        `${borrower.name} pinjam ${rp(a.principal)} ke ${lender.name} (bunga ${a.interestPct}%, total ${rp(loanDue(a.principal, a.interestPct))}). Jatuh tempo putaran ${s.round + CONFIG.loan.dueRounds}.`,
        'info',
      );
      return;
    }

    case 'REPAY_LOAN': {
      if (s.prompt || (s.phase !== 'preRoll' && s.phase !== 'postRoll')) fail('Tidak bisa melunasi sekarang.');
      const l = s.loans.find((x) => x.id === a.loanId) ?? fail('Utang tidak ditemukan.');
      const due = loanDue(l!.principal, l!.interestPct);
      const b = getPlayer(s, l!.borrower);
      if (b.cash < due) fail('Uang tidak cukup untuk melunasi.');
      transfer(s, b.id, l!.lender, due);
      s.loans = s.loans.filter((x) => x.id !== l!.id);
      log(s, `${b.name} melunasi utang ${rp(due)} ke ${nameOf(s, l!.lender)}.`, 'good');
      return;
    }

    case 'END_TURN': {
      if (!canEndTurn(s)) fail('Belum bisa mengakhiri giliran.');
      if (s.kilat?.endsAt && a.now !== undefined && a.now >= s.kilat.endsAt) {
        finishGame(s, 'waktu permainan habis');
        return;
      }
      advanceTurn(s);
      return;
    }

    case 'FINISH_GAME':
      finishGame(s, a.reason);
      return;
  }
}

function settleAuction(s: GameState) {
  const pr = s.prompt;
  if (!pr || pr.type !== 'auction') return;
  const t = ownable(pr.tile);
  if (pr.bidders.length === 0) {
    log(s, `Tidak ada yang menawar. ${t.short} tetap milik Bank.`, 'info');
    return resolvePromptAndRun(s);
  }
  if (pr.bidders.length === 1 && pr.highBidder === pr.bidders[0]) {
    const w = getPlayer(s, pr.highBidder);
    transfer(s, w.id, 'bank', pr.highBid);
    s.board[pr.tile].owner = w.id;
    log(s, `🔨 Terjual! ${w.name} memenangkan lelang ${t.short} seharga ${rp(pr.highBid)}.`, 'good');
    return resolvePromptAndRun(s);
  }
}

function autoLiquidate(s: GameState, playerId: string, target: number) {
  const p = getPlayer(s, playerId);
  // 1) jual bangunan, mulai dari yang termurah, tetap merata
  for (let guard = 0; guard < 200 && p.cash < target; guard++) {
    const sellable = ownedTiles(s, p.id).filter((i) => canSellBuilding(s, p.id, i));
    if (!sellable.length) break;
    sellable.sort((a, b) => sellValue(a) - sellValue(b));
    const i = sellable[0];
    s.board[i].level -= 1;
    transfer(s, 'bank', p.id, sellValue(i));
    log(s, `${p.name} menjual 1 bangunan di ${TILES[i].short} (${rp(sellValue(i))}).`, 'info');
  }
  // 2) gadai properti, mulai dari yang nilai gadainya terkecil
  for (let guard = 0; guard < 50 && p.cash < target; guard++) {
    const m = ownedTiles(s, p.id).filter((i) => canMortgage(s, p.id, i));
    if (!m.length) break;
    m.sort((a, b) => ownable(a).mortgage - ownable(b).mortgage);
    const i = m[0];
    s.board[i].mortgaged = true;
    transfer(s, 'bank', p.id, ownable(i).mortgage);
    log(s, `${p.name} menggadaikan ${TILES[i].short} (${rp(ownable(i).mortgage)}).`, 'info');
  }
}

function doTrade(s: GameState, aId: string, bId: string, aGives: TradeOffer, bGives: TradeOffer) {
  if (s.prompt || (s.phase !== 'preRoll' && s.phase !== 'postRoll')) fail('Jual-beli hanya di luar proses giliran.');
  const cur = currentPlayer(s).id;
  if (aId === bId || (aId !== cur && bId !== cur)) fail('Jual-beli harus melibatkan pemain yang sedang giliran.');
  const A = getPlayer(s, aId);
  const B = getPlayer(s, bId);
  if (A.bankrupt || B.bankrupt) fail('Pemain sudah bangkrut.');
  const check = (P: Player, o: TradeOffer) => {
    if (!Number.isInteger(o.cash) || o.cash < 0 || o.cash > P.cash) fail(`Uang ${P.name} tidak cukup.`);
    for (const i of o.tiles) if (!canTradeTile(s, P.id, i)) fail(`${TILES[i].short} tidak bisa diperdagangkan (bukan milik ${P.name} atau ada bangunan di grupnya).`);
    for (const c of o.items) if (!P.items.some((it) => it.cardId === c)) fail(`${P.name} tidak memegang kartu ${c}.`);
  };
  check(A, aGives);
  check(B, bGives);
  if (!aGives.cash && !aGives.tiles.length && !aGives.items.length && !bGives.cash && !bGives.tiles.length && !bGives.items.length)
    fail('Penawaran kosong.');
  const move = (from: Player, to: Player, o: TradeOffer) => {
    transfer(s, from.id, to.id, o.cash);
    for (const i of o.tiles) s.board[i].owner = to.id;
    for (const c of o.items) {
      const idx = from.items.findIndex((it) => it.cardId === c);
      to.items.push(...from.items.splice(idx, 1));
    }
  };
  move(A, B, aGives);
  move(B, A, bGives);
  const desc = (o: TradeOffer) =>
    [o.cash ? rp(o.cash) : '', ...o.tiles.map((i) => TILES[i].short), ...o.items.map((c) => `kartu "${CARD_BY_ID[c].title}"`)]
      .filter(Boolean)
      .join(', ') || 'tidak ada';
  log(s, `🤝 Deal! ${A.name} memberi ${desc(aGives)}; ${B.name} memberi ${desc(bGives)}.`, 'info');
}

// ===================== Konservasi uang (untuk test & simulator) =====================

/** Total uang di pemain + Kas Warkop + Kas Arisan + neraca Bank harus selalu 0. */
export function moneyBalance(s: GameState): number {
  return s.players.reduce((a, p) => a + p.cash, 0) + s.warkop + s.arisan + s.bank;
}

export { GROUP_BY_ID };
