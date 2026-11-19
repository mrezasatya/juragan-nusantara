export type CharacterId = 'ojol' | 'kos' | 'warung' | 'kantoran' | 'pns' | 'sd' | 'punk' | 'mie';

export interface TokenOption {
  id: CharacterId;
  label: string;
  emoji: string; // dipakai di tampilan 2D & panel
  skin: string;
}

// 8 pion karakter (figurin chibi di atas alas bundar berwarna pemain).
export const TOKENS: TokenOption[] = [
  { id: 'ojol', label: 'Mas Ojol', emoji: '🛵', skin: '#E2AE84' },
  { id: 'kos', label: 'Pak Kos', emoji: '🏠', skin: '#D59A6E' },
  { id: 'warung', label: 'Bu Warung', emoji: '🍲', skin: '#E8B98F' },
  { id: 'kantoran', label: 'Mas Kantoran', emoji: '💼', skin: '#EDC29C' },
  { id: 'pns', label: 'Pak PNS', emoji: '📋', skin: '#D9A275' },
  { id: 'sd', label: 'Adik SD', emoji: '🎒', skin: '#E9B88C' },
  { id: 'punk', label: 'Bang Punk', emoji: '🤘', skin: '#DDA679' },
  { id: 'mie', label: 'Mas Mie Ayam', emoji: '🍜', skin: '#D49A6C' },
];

// ID pion versi lama → karakter baru, agar permainan yang tersimpan tetap bisa dilanjutkan.
const LEGACY: Record<string, CharacterId> = {
  ojek: 'ojol',
  becak: 'kos',
  bakso: 'warung',
  angkot: 'kantoran',
  delman: 'pns',
  ondel: 'sd',
  bajaj: 'punk',
  pinisi: 'mie',
};
export const normalizeToken = (id: string): CharacterId => (TOKENS.some((t) => t.id === id) ? (id as CharacterId) : (LEGACY[id] ?? 'ojol'));
export const tokenInfo = (id: string) => TOKENS.find((t) => t.id === normalizeToken(id))!;
export const tokenEmoji = (id: string) => tokenInfo(id).emoji;

export const PLAYER_COLORS = ['#C0392B', '#1F5F8B', '#3E8B3A', '#D99A0B', '#7B4FA0', '#D2557F'];

export const DEFAULT_NAMES = ['Juragan Kopi', 'Bu Kos', 'Pak RT', 'Mas Ojol', 'Kak Admin', 'Om Toko'];

export const ITEM_LABEL: Record<string, string> = {
  jail_free: 'Remisi 17 Agustus',
  orang_dalam: 'Kartu Orang Dalam',
  disaster_shield: 'Asuransi Bencana',
};
export const ITEM_HELP: Record<string, string> = {
  jail_free: 'Keluar dari Hotel Prodeo.',
  orang_dalam: 'Keluar dari Hotel Prodeo atau lolos Pos Pungli.',
  disaster_shield: 'Batalkan 1 kartu [Bencana]. Dipakai saat kartu Bencana muncul.',
};
