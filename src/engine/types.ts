// ===== Data konten (berasal dari src/data/*.json) =====
// Semua nominal dalam JUTA Rupiah.

export type GroupId = 'kopi' | 'langit' | 'jambu' | 'jeruk' | 'cabai' | 'kunyit' | 'pandan' | 'nila';
export type DeckId = 'nasib' | 'warga';
export type ItemKind = 'jail_free' | 'orang_dalam' | 'disaster_shield';

interface TileBase {
  index: number;
  name: string;
  short: string;
  icon: string;
  caption: string;
  rule: string;
}
export interface PropertyTile extends TileBase {
  kind: 'property';
  group: GroupId;
  province: string;
  provinceShort: string;
  landmark: string;
  price: number;
  rent: number[]; // [dasar, 1, 2, 3, 4 homestay, resort]
  mortgage: number;
  buildCost: number;
  fact: string;
  greeting: string;
}
export interface TransportTile extends TileBase {
  kind: 'transport';
  price: number;
  mortgage: number;
}
export interface UtilityTile extends TileBase {
  kind: 'utility';
  price: number;
  mortgage: number;
}
export interface TaxTile extends TileBase {
  kind: 'tax';
  amount: number;
  percent: number | null;
}
export interface CardTile extends TileBase {
  kind: 'card';
  deck: DeckId;
}
export interface SpecialTile extends TileBase {
  kind: 'start' | 'jail' | 'warkop' | 'goToJail' | 'pungli';
}
export type Tile = PropertyTile | TransportTile | UtilityTile | TaxTile | CardTile | SpecialTile;
export type OwnableTile = PropertyTile | TransportTile | UtilityTile;

export interface GroupInfo {
  id: GroupId;
  name: string;
  color: string;
  region: string;
  motif: string;
  buildCost: number;
}

export type PayTarget = 'bank' | 'warkop';

export type CardEffect =
  | { type: 'RECEIVE'; amount: number }
  | { type: 'PAY'; amount: number }
  | { type: 'PAY_WARKOP'; amount: number }
  | { type: 'RECEIVE_FROM_ALL'; amount: number }
  | { type: 'ALL_RECEIVE'; amount: number }
  | { type: 'PAY_TO_PLAYER'; amount: number; target: 'left' | 'poorest' }
  | { type: 'POOREST_RECEIVE_FROM_ALL'; amount: number }
  | { type: 'TAKE_ARISAN' }
  | { type: 'CLEAR_ARISAN' }
  | { type: 'MOVE_TO'; tile: number }
  | { type: 'MOVE_TO_NO_SALARY'; tile: number }
  | { type: 'MOVE_TO_NEAREST_TRANSPORT'; rentMultiplier: number }
  | { type: 'MOVE_STEPS'; steps: number; alsoPay?: { amount: number; to: PayTarget } }
  | { type: 'SKIP_TURN' }
  | { type: 'SKIP_OR_PAY'; amount: number; to: PayTarget }
  | { type: 'GO_TO_JAIL' }
  | { type: 'KEEP_ITEM'; item: ItemKind }
  | { type: 'PAY_PER_BUILDING'; perHomestay: number; perResort: number; to: PayTarget }
  | { type: 'FREE_BUILDING'; fallbackAmount: number }
  | { type: 'DICE_OUTCOME'; even: { receive: number }; odd: { pay: number; to: PayTarget } }
  | { type: 'CONDITIONAL_WEALTH'; receive: number; threshold: number; penalty: number; penaltyTo: PayTarget }
  | { type: 'DEFERRED_PAY'; receive: number; pay: number; trigger: 'pass_start' };

export interface Card {
  id: string;
  deck: DeckId;
  side: 'kebaikan' | 'sindiran';
  tags: string[];
  title: string;
  text: string;
  effectText: string;
  effect: CardEffect;
}

export interface GameConfig {
  startMoney: number;
  salary: number;
  arisanFee: number;
  jail: { tile: number; fine: number; maxAttempts: number; fineTo: PayTarget };
  pungli: { flat: number; nego: { low: number; mid: number; high: number }; to: PayTarget };
  transportRent: number[];
  utilityMultiplier: number[];
  setRentMultiplier: number;
  mortgageInterest: number;
  buildingSellRatio: number;
  auction: { startBid: number };
  loan: { maxInterestPct: number; dueRounds: number; penaltyPct: number };
  kilat: { startingProperties: number; defaultRounds: number; defaultMinutes: number };
}

// ===== State permainan =====

export type GameMode = 'klasik' | 'kilat';
export type DiceMode = 'digital' | 'fisik';

export interface HeldItem {
  cardId: string;
  kind: ItemKind;
}

export interface DeferredDebt {
  id: string;
  cardId: string;
  amount: number;
}

export interface Player {
  id: string;
  name: string;
  token: string;
  color: string;
  cash: number;
  position: number;
  inJail: boolean;
  jailAttempts: number;
  skipTurns: number;
  doublesCount: number;
  items: HeldItem[];
  deferred: DeferredDebt[];
  bankrupt: boolean;
  bankruptRound: number | null;
}

export interface OwnershipState {
  owner: string | null;
  level: number; // 0..4 homestay, 5 = resort
  mortgaged: boolean;
}

export interface Loan {
  id: string;
  lender: string;
  borrower: string;
  principal: number;
  interestPct: number;
  createdRound: number;
  dueRound: number;
}

export type Creditor = 'bank' | 'warkop' | 'arisan' | { player: string };

export interface PayTask {
  t: 'pay';
  from: string;
  to: Creditor;
  amount: number;
  reason: string;
  loanId?: string;
}

export type Task =
  | PayTask
  | { t: 'receive'; player: string; amount: number; reason: string }
  | { t: 'move'; player: string; steps: number }
  | { t: 'moveTo'; player: string; tile: number; salary: boolean; rentMultiplier?: number }
  | { t: 'land'; player: string; rentMultiplier?: number }
  | { t: 'goToJail'; player: string; reason: string }
  | { t: 'draw'; player: string; deck: DeckId }
  | { t: 'effect'; player: string; cardId: string }
  | { t: 'releaseCard'; cardId: string }
  | { t: 'checkLoans'; player: string };

export type Prompt =
  | { type: 'buy'; player: string; tile: number }
  | {
      type: 'auction';
      tile: number;
      highBid: number;
      highBidder: string | null;
      bidders: string[]; // masih ikut, urutan giliran
      turn: number; // indeks ke bidders
    }
  | { type: 'card'; player: string; cardId: string; options: CardOption[] }
  | { type: 'incomeTax'; player: string; flat: number; percentAmount: number }
  | { type: 'pungli'; player: string }
  | { type: 'freeBuilding'; player: string; tiles: number[] }
  | { type: 'debt'; player: string; amount: number; to: Creditor; reason: string; allowSurrender: boolean }
  | { type: 'jailRoll'; player: string }; // pemain di Hotel Prodeo memilih cara keluar

export type CardOption = 'ok' | 'skip' | 'pay' | 'shield' | 'roll';

export type Phase = 'preRoll' | 'resolving' | 'postRoll' | 'gameOver';

export interface LogEntry {
  id: number;
  round: number;
  text: string;
  tone?: 'good' | 'bad' | 'info' | 'card';
}

export interface MoveEvent {
  seq: number;
  player: string;
  from: number;
  to: number;
  mode: 'walk' | 'back' | 'jump';
}

export interface GameState {
  version: 1;
  mode: GameMode;
  diceMode: DiceMode;
  kilat: { maxRounds: number | null; endsAt: number | null } | null;
  players: Player[];
  current: number; // indeks pemain yang sedang giliran
  round: number;
  phase: Phase;
  prompt: Prompt | null;
  queue: Task[];
  board: Record<number, OwnershipState>;
  decks: Record<DeckId, { draw: string[]; discard: string[] }>;
  warkop: number;
  arisan: number;
  bank: number; // neraca bank: + menerima, - membayar (untuk cek konservasi uang)
  lastDice: [number, number] | null;
  lastSingleDie: number | null;
  rolledDoubles: boolean; // giliran ini berhak lempar lagi
  loans: Loan[];
  rng: number;
  log: LogEntry[];
  logSeq: number;
  moves: MoveEvent[];
  moveSeq: number;
  lastCard: { cardId: string; player: string; seq: number } | null;
  winner: string | null;
  endReason: string | null;
  startedAt: number;
  turnCount: number;
}

export interface TradeOffer {
  cash: number;
  tiles: number[];
  items: string[]; // cardId
}

export type Action =
  | { type: 'ROLL'; dice?: [number, number] }
  | { type: 'BUY' }
  | { type: 'DECLINE_BUY' }
  | { type: 'BID'; player: string; amount: number }
  | { type: 'PASS_BID'; player: string }
  | { type: 'CARD_CHOICE'; option: CardOption; die?: number }
  | { type: 'INCOME_TAX'; choice: 'flat' | 'percent' }
  | { type: 'PUNGLI'; choice: 'pay' | 'nego' | 'orang_dalam'; die?: number }
  | { type: 'FREE_BUILDING'; tile: number }
  | { type: 'JAIL_PAY' }
  | { type: 'JAIL_USE_ITEM'; item: 'jail_free' | 'orang_dalam' }
  | { type: 'BUILD'; tile: number }
  | { type: 'SELL_BUILDING'; tile: number }
  | { type: 'MORTGAGE'; tile: number }
  | { type: 'UNMORTGAGE'; tile: number }
  | { type: 'PAY_DEBT' }
  | { type: 'SURRENDER_PROPERTY'; tile: number }
  | { type: 'DECLARE_BANKRUPTCY' }
  | { type: 'TRADE'; a: string; b: string; aGives: TradeOffer; bGives: TradeOffer }
  | { type: 'LOAN'; lender: string; borrower: string; principal: number; interestPct: number }
  | { type: 'REPAY_LOAN'; loanId: string }
  | { type: 'END_TURN'; now?: number }
  | { type: 'FINISH_GAME'; reason: string };
