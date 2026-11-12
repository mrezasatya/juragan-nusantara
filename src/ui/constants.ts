export interface TokenOption {
  id: string;
  label: string;
  emoji: string;
}

// Pion (Bagian 9). Sementara memakai emoji; mudah diganti ilustrasi SVG/PNG di sini.
export const TOKENS: TokenOption[] = [
  { id: 'becak', label: 'Becak', emoji: '🚲' },
  { id: 'bajaj', label: 'Bajaj', emoji: '🛺' },
  { id: 'angkot', label: 'Angkot', emoji: '🚐' },
  { id: 'pinisi', label: 'Kapal Pinisi', emoji: '⛵' },
  { id: 'delman', label: 'Delman', emoji: '🐎' },
  { id: 'bakso', label: 'Gerobak Bakso', emoji: '🍜' },
  { id: 'ojek', label: 'Motor Ojek', emoji: '🛵' },
  { id: 'ondel', label: 'Ondel-ondel', emoji: '🎭' },
];
export const tokenEmoji = (id: string) => TOKENS.find((t) => t.id === id)?.emoji ?? '●';

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
