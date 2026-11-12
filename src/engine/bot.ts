// Bot sederhana untuk simulator (dan kelak lawan komputer di Fase 2 brief).
// Strategi "pemain wajar": beli jika masih punya cadangan, bangun jika grup lengkap,
// lelang sampai ~harga beli, keluar Hotel Prodeo dengan kartu atau bayar jika mampu.

import { CONFIG, GROUPS, TILES, groupMembers, ownable } from './data.ts';
import {
  canBuild,
  canEndTurn,
  canTradeTile,
  canRoll,
  canUnmortgage,
  currentPlayer,
  getPlayer,
  liquidationValue,
  ownedTiles,
  tileAssetValue,
} from './engine.ts';
import type { Action, GameState } from './types.ts';

export interface BotProfile {
  reserve: number; // uang cadangan minimal setelah membeli/membangun
  auctionMaxRatio: number; // tawaran maksimal relatif terhadap harga
}
export const DEFAULT_BOT: BotProfile = { reserve: 150, auctionMaxRatio: 1 };

export function botAction(s: GameState, profile: BotProfile = DEFAULT_BOT): Action {
  const pr = s.prompt;
  if (pr) {
    switch (pr.type) {
      case 'buy': {
        const p = getPlayer(s, pr.player);
        return p.cash - ownable(pr.tile).price >= profile.reserve ? { type: 'BUY' } : { type: 'DECLINE_BUY' };
      }
      case 'auction': {
        const bidder = getPlayer(s, pr.bidders[pr.turn]);
        const next = Math.max(CONFIG.auction.startBid, pr.highBid + 10);
        const limit = ownable(pr.tile).price * profile.auctionMaxRatio;
        if (next <= limit && bidder.cash - next >= profile.reserve) return { type: 'BID', player: bidder.id, amount: next };
        return { type: 'PASS_BID', player: bidder.id };
      }
      case 'card':
        if (pr.options.includes('shield')) return { type: 'CARD_CHOICE', option: 'shield' };
        if (pr.options.includes('roll')) return { type: 'CARD_CHOICE', option: 'roll' };
        if (pr.options.includes('pay'))
          return { type: 'CARD_CHOICE', option: getPlayer(s, pr.player).cash > profile.reserve ? 'pay' : 'skip' };
        return { type: 'CARD_CHOICE', option: 'ok' };
      case 'incomeTax':
        return { type: 'INCOME_TAX', choice: pr.flat <= pr.percentAmount ? 'flat' : 'percent' };
      case 'pungli':
        if (getPlayer(s, pr.player).items.some((i) => i.kind === 'orang_dalam')) return { type: 'PUNGLI', choice: 'orang_dalam' };
        return { type: 'PUNGLI', choice: 'nego' };
      case 'freeBuilding':
        return { type: 'FREE_BUILDING', tile: pr.tiles[pr.tiles.length - 1] };
      case 'debt': {
        const p = getPlayer(s, pr.player);
        if (p.cash >= pr.amount) return { type: 'PAY_DEBT' };
        if (liquidationValue(s, p.id) >= pr.amount) return { type: 'AUTO_LIQUIDATE' };
        if (pr.allowSurrender) {
          const tiles = ownedTiles(s, p.id).sort((a, b) => tileAssetValue(s, b) - tileAssetValue(s, a));
          if (tiles.length) return { type: 'SURRENDER_PROPERTY', tile: tiles[0] };
        }
        return { type: 'DECLARE_BANKRUPTCY' };
      }
      case 'jailRoll':
        return { type: 'ROLL' };
    }
  }

  const me = currentPlayer(s);
  // Lunasi utang jika mampu.
  const myLoan = s.loans.find((l) => l.borrower === me.id);
  if (myLoan && me.cash > 600) return { type: 'REPAY_LOAN', loanId: myLoan.id };

  if (s.phase === 'preRoll' && me.inJail) {
    const item = me.items.find((i) => i.kind === 'jail_free' || i.kind === 'orang_dalam');
    if (item) return { type: 'JAIL_USE_ITEM', item: item.kind as 'jail_free' | 'orang_dalam' };
    if (me.cash > 400) return { type: 'JAIL_PAY' };
    return { type: 'ROLL' };
  }

  // Jual-beli: lengkapi grup warna dengan membeli petak terakhir dari pemain lain (harga 1,5×).
  if (!s.prompt && (s.phase === 'preRoll' || s.phase === 'postRoll')) {
    for (const g of GROUPS) {
      const members = groupMembers(g.id);
      const mine = members.filter((i) => s.board[i].owner === me.id);
      if (mine.length !== members.length - 1) continue;
      const missing = members.find((i) => s.board[i].owner !== me.id)!;
      const owner = s.board[missing].owner;
      if (!owner || owner === me.id) continue;
      const theirs = members.filter((i) => s.board[i].owner === owner).length;
      if (theirs !== 1 || !canTradeTile(s, owner, missing)) continue;
      const price = Math.round(ownable(missing).price * 1.5);
      if (me.cash - price >= profile.reserve + 100)
        return {
          type: 'TRADE',
          a: me.id,
          b: owner,
          aGives: { cash: price, tiles: [], items: [] },
          bGives: { cash: 0, tiles: [missing], items: [] },
        };
    }
  }

  // Tebus gadai & bangun jika uang longgar.
  for (const i of ownedTiles(s, me.id)) {
    if (canUnmortgage(s, me.id, i) && me.cash - 400 > 0) return { type: 'UNMORTGAGE', tile: i };
  }
  const buildable = ownedTiles(s, me.id)
    .filter((i) => canBuild(s, me.id, i))
    .sort((a, b) => TILES[b].index - TILES[a].index);
  for (const i of buildable) {
    const t = TILES[i];
    if (t.kind === 'property' && me.cash - t.buildCost >= profile.reserve + 100) return { type: 'BUILD', tile: i };
  }

  if (canRoll(s)) return { type: 'ROLL' };
  if (canEndTurn(s)) return { type: 'END_TURN' };
  throw new Error(`Bot buntu: phase=${s.phase} prompt=${JSON.stringify(s.prompt)}`);
}
