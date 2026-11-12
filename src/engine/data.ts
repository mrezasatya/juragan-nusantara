import tilesJson from '../data/tiles.json';
import cardsJson from '../data/cards.json';
import groupsJson from '../data/groups.json';
import configJson from '../data/config.json';
import type { Card, GameConfig, GroupId, GroupInfo, OwnableTile, PropertyTile, Tile } from './types.ts';

export const TILES = tilesJson as Tile[];
export const CARDS = cardsJson as Card[];
export const GROUPS = groupsJson as GroupInfo[];
export const CONFIG = configJson as GameConfig;

export const CARD_BY_ID: Record<string, Card> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<GroupId, GroupInfo>;

export const isOwnable = (t: Tile): t is OwnableTile =>
  t.kind === 'property' || t.kind === 'transport' || t.kind === 'utility';

export const OWNABLE_INDEXES = TILES.filter(isOwnable).map((t) => t.index);
export const PROPERTY_TILES = TILES.filter((t): t is PropertyTile => t.kind === 'property');
export const TRANSPORT_INDEXES = TILES.filter((t) => t.kind === 'transport').map((t) => t.index);
export const UTILITY_INDEXES = TILES.filter((t) => t.kind === 'utility').map((t) => t.index);

export function groupMembers(group: GroupId): number[] {
  return PROPERTY_TILES.filter((t) => t.group === group).map((t) => t.index);
}

export function ownable(index: number): OwnableTile {
  const t = TILES[index];
  if (!isOwnable(t)) throw new Error(`Petak ${index} tidak bisa dimiliki`);
  return t;
}
