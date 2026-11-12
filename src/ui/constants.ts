export type HatKind = 'caping' | 'pet' | 'handuk' | 'pelaut' | 'blangkon' | 'bandana' | 'helm' | 'sanggul';

export interface TokenOption {
  id: string;
  label: string;
  emoji: string; // dipakai di tampilan 2D & panel
  hat: HatKind;
  skin: string;
  pants: string;
}

// Pion manusia 3D (id tetap sama dengan versi sebelumnya agar simpanan lama tetap terbaca).
export const TOKENS: TokenOption[] = [
  { id: 'becak', label: 'Abang Becak', emoji: '👒', hat: 'caping', skin: '#C68A5B', pants: '#3B4A6B' },
  { id: 'bajaj', label: 'Bang Bajaj', emoji: '🧢', hat: 'pet', skin: '#B97A4E', pants: '#2F3A2F' },
  { id: 'angkot', label: 'Sopir Angkot', emoji: '🚐', hat: 'handuk', skin: '#A86B43', pants: '#4A3B2A' },
  { id: 'pinisi', label: 'Pelaut Pinisi', emoji: '⛵', hat: 'pelaut', skin: '#8E5A36', pants: '#F2F2F2' },
  { id: 'delman', label: 'Kusir Delman', emoji: '🐎', hat: 'blangkon', skin: '#C99368', pants: '#2B2B2B' },
  { id: 'bakso', label: 'Mas Bakso', emoji: '🍜', hat: 'bandana', skin: '#D8A57B', pants: '#5A4632' },
  { id: 'ojek', label: 'Mas Ojek', emoji: '🛵', hat: 'helm', skin: '#B47F57', pants: '#1F2A44' },
  { id: 'ondel', label: 'Mbak Penari', emoji: '💃', hat: 'sanggul', skin: '#E0B08A', pants: '#7B2D5B' },
];
export const tokenInfo = (id: string) => TOKENS.find((t) => t.id === id) ?? TOKENS[0];
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
