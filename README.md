# Juragan Nusantara

> *"Borong Nusantara, asal kuat bayar iuran."*

Board game properti bertema Indonesia, dimainkan di browser (HP, laptop, atau proyektor). Pemain berkeliling 22 provinsi dari Sabang sampai Merauke, membeli properti, membangun Homestay dan Resort, dan menghadapi Kartu Nasib serta Kartu Warga yang berisi 50% kebanggaan Indonesia dan 50% sindiran fenomena sehari-hari.

Proyek hiburan non-komersial. Spesifikasi lengkap ada di [`docs/konsep-game-juragan-nusantara.md`](docs/konsep-game-juragan-nusantara.md).

## Fitur MVP

- Main bergantian di satu perangkat (pass-and-play), 2–6 pemain.
- **Mode Klasik** (menang jika semua lawan bangkrut) dan **Mode Kilat** (batas putaran atau waktu, pemenang = total aset terbesar).
- 40 petak, 22 provinsi, dan 100 kartu sesuai dokumen konsep, termasuk Kas Warkop, Kas Arisan, Pos Pungli, Hotel Prodeo, kartu simpan, kartu [Bencana], dan efek tertunda.
- Lelang, jual-beli antarpemain, utang ke tetangga, gadai, dan bangun merata.
- Dadu digital (pengacak kriptografis browser) atau **dadu fisik** (masukkan angka dari dadu sungguhan).
- Tutorial singkat, halaman Cara Main, dan detail setiap petak saat disentuh.
- Simpan otomatis ke browser. Permainan bisa dilanjutkan setelah browser ditutup.
- Responsif dari lebar 360px sampai layar proyektor.

## Menjalankan

Butuh Node.js 20 atau lebih baru.

```bash
npm install
npm run dev        # mode pengembangan → http://localhost:5173
npm run build      # build produksi ke dist/
npm run preview    # menjalankan hasil build → http://localhost:4173
```

## Pengujian

```bash
npm test           # unit test: data konten, engine aturan, ke-100 kartu
npm run simulate   # simulasi ratusan permainan antar-bot + laporan balancing (beberapa menit)
npm run e2e        # test browser end-to-end (butuh `npm run preview` aktif & Playwright)
```

Untuk `npm run e2e`, pasang Playwright terlebih dahulu: `npm i -D playwright && npx playwright install chromium`.

## Mengubah isi game tanpa menyentuh kode

Semua nominal dalam satuan **juta Rupiah**.

| File | Isi |
|---|---|
| `src/data/config.json` | Modal awal, gaji, iuran arisan, denda Hotel Prodeo, tarif Pos Pungli, sewa transportasi/utilitas, aturan utang, default Mode Kilat |
| `src/data/cards.json` | 100 kartu: judul, teks, keterangan efek, dan objek `effect` (jenis efek & nominal) |
| `src/data/tiles.json` | 40 petak: harga, sewa, nilai gadai, fakta, sapaan daerah |
| `docs/cara-main.md` | Buku aturan. Halaman "Cara Main" di aplikasi membaca file ini langsung |

`tiles.json` dan `cards.json` dihasilkan dari dokumen konsep lewat `npm run extract`. Jika mengubah dokumen konsep, jalankan ulang perintah itu, lalu `npm test`. Test akan gagal jika data tidak lagi identik dengan dokumen. Jika mengubah nominal langsung di JSON, sesuaikan juga teks efek (`effectText`) dan dokumen konsep agar test tetap lolos.

## Struktur

```
docs/              dokumen konsep, buku aturan, catatan keputusan, hasil simulasi
scripts/           ekstraksi data dari dokumen konsep
src/data/          tiles.json, cards.json, groups.json, config.json
src/engine/        aturan permainan sebagai fungsi murni (tanpa React) + unit test
src/sim/           simulator bot untuk uji kestabilan & balancing
src/components/    UI React: papan, panel, modal
e2e/               test browser end-to-end
```

## Deploy ke Vercel

Proyek sudah dikonfigurasi (`vercel.json`). Impor repositori di Vercel, atau jalankan `npx vercel` dari folder proyek. Tidak butuh environment variable maupun backend.

## Catatan

- Ikon petak dan pion sementara memakai emoji. Ilustrasi bisa diganti di `src/ui/constants.ts` (pion) dan `scripts/extract-content.ts` (ikon petak).
- Keputusan atas aturan yang tidak dijelaskan dokumen konsep tercatat di [`docs/keputusan-desain.md`](docs/keputusan-desain.md).
- Harga di dalam game adalah mekanik permainan, bukan penilaian terhadap daerah atau warganya.
