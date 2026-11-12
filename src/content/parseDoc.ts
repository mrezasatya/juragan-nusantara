// Parser dokumen konsep (docs/konsep-game-juragan-nusantara.md).
// Dipakai oleh skrip ekstraksi (scripts/extract-content.ts) dan oleh test
// yang memastikan isi src/data/*.json tetap identik dengan dokumen.

export interface RawTileRow {
  index: number;
  name: string;
  kind: string;
  note: string;
}

export interface RawPriceRow {
  index: number;
  name: string;
  price: number;
  rent: number[]; // [dasar, 1, 2, 3, 4 homestay, resort]
  mortgage: number;
}

export interface RawFactRow {
  name: string;
  fact: string;
  greeting: string;
}

export interface RawCardRow {
  id: string;
  title: string;
  tags: string[];
  text: string;
  effectText: string;
}

/** Ambil semua baris tabel markdown (tanpa header & pemisah). */
function tableRows(md: string): string[][] {
  const rows: string[][] = [];
  for (const line of md.split('\n')) {
    const t = line.trim();
    if (!t.startsWith('|') || !t.endsWith('|')) continue;
    const cells = t
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    rows.push(cells);
  }
  return rows;
}

/** Potong dokumen di antara dua judul. */
function section(md: string, startHeading: string, endHeading: string): string {
  const s = md.indexOf(startHeading);
  if (s < 0) throw new Error(`Judul tidak ditemukan: ${startHeading}`);
  const e = md.indexOf(endHeading, s + startHeading.length);
  if (e < 0) throw new Error(`Judul tidak ditemukan: ${endHeading}`);
  return md.slice(s, e);
}

/** Hapus penanda markdown tebal/miring. */
export function stripMd(s: string): string {
  return s.replace(/\*\*/g, '').replace(/\*/g, '').trim();
}

const num = (s: string) => Number(s.replace(/\./g, '').replace(',', '.'));

export function parseTiles(md: string): RawTileRow[] {
  const sec = section(md, '### 3.1 Layout 40 Petak', '## 4. Data Properti');
  return tableRows(sec)
    .filter((r) => /^\d+$/.test(r[0]))
    .map((r) => ({ index: Number(r[0]), name: stripMd(r[1]), kind: r[2], note: r[3] ?? '' }));
}

export function parsePrices(md: string): RawPriceRow[] {
  const sec = section(md, '### 4.2 Tabel Harga', '### 4.3');
  return tableRows(sec)
    .filter((r) => /^\d+$/.test(r[0]))
    .map((r) => ({
      index: Number(r[0]),
      name: r[1],
      price: num(r[2]),
      rent: r.slice(3, 9).map(num),
      mortgage: num(r[9]),
    }));
}

export function parseFacts(md: string): RawFactRow[] {
  const sec = section(md, '### 4.4 Isi Kartu Properti', '## 5. Mekanik');
  return tableRows(sec)
    .filter((r) => r[0] !== 'Properti')
    .map((r) => ({ name: r[0], fact: r[1], greeting: r[2] === '—' ? '' : stripMd(r[2]) }));
}

export function parseCards(md: string): RawCardRow[] {
  const sec = section(md, '## 6. Daftar Kartu', '## 7. Aturan Main');
  return tableRows(sec)
    .filter((r) => /^[NW]\d{2}$/.test(r[0]))
    .map((r) => {
      const tags: string[] = [];
      let title = r[1];
      if (/\[Bencana\]/i.test(title)) {
        tags.push('bencana');
        title = title.replace(/\*{0,2}\[Bencana\]\*{0,2}/i, '');
      }
      return { id: r[0], title: stripMd(title), tags, text: stripMd(r[2]), effectText: stripMd(r[3]) };
    });
}

/** Pisahkan keterangan petak menjadi aturan & caption jenaka (teks dalam *"..."*). */
export function splitNote(note: string): { rule: string; caption: string } {
  const m = note.match(/\*"(.+?)"\*/);
  const caption = m ? m[1] : '';
  const rule = stripMd(note.replace(/\*"(.+?)"\*/, '')).trim();
  return { rule, caption };
}

/** Ambil bagian setelah tanda "—" (nama ikon/landmark). */
export function landmarkOf(name: string): string {
  const i = name.indexOf('—');
  return i >= 0 ? name.slice(i + 1).trim() : name.trim();
}
export function regionOf(name: string): string {
  const i = name.indexOf('—');
  return i >= 0 ? name.slice(0, i).trim() : '';
}
