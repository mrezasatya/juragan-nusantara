# Catatan Keputusan Desain & Hasil Simulasi — MVP

Dokumen ini mencatat aturan yang **tidak dijelaskan** di `konsep-game-juragan-nusantara.md` dan bagaimana aturan itu diterapkan di MVP. Semua angka bisa diubah di `src/data/config.json` atau `src/data/cards.json` tanpa menyentuh kode.

## 1. Aturan ambigu yang disepakati sebelum build

| # | Ambiguitas | Keputusan di MVP |
|---|---|---|
| 1 | Jual-beli properti antarpemain | Ada. Properti, uang, dan kartu simpan bisa diperdagangkan |
| 2 | Batas Mode Kilat | Bisa memilih batas putaran (default 15) atau batas waktu (default 45 menit) |
| 3 | Pajak Penghasilan & "total aset" | Pemain memilih. Total aset = uang + harga properti (yang digadai dihitung harga − nilai gadai) + biaya bangunan |
| 4 | "Pemain di sebelah kiri" (W27) | Pemain berikutnya dalam urutan giliran |
| 5 | Utang tak lunas & uang kurang | Peminjam memilih properti yang diserahkan sampai nilainya menutup sisa utang |
| 6 | Batas stok bangunan | Tanpa batas |
| 7 | Bangkrut ke Bank | Properti kembali ke Bank tanpa pemilik (tidak dilelang) |
| 8 | Gagal dobel 3× di Hotel Prodeo | Bayar denda Rp 50 jt, lalu jalan sesuai dadu terakhir |
| 9 | Seri "pemain termiskin" | Pemain yang paling dekat dalam urutan giliran, mulai dari pemain aktif |
| 10 | Mode Edukasi | Tidak masuk MVP (Fase 2 brief) |

## 2. Keputusan teknis tambahan selama build

- **N29 Musim Kabut Asap:** bayar masker Rp 5 jt ke Kas Warkop dulu, baru mundur 3 petak (lalu aksi petak tujuan berjalan).
- **W28 Bansos Salah Sasaran:** syarat "uang di atas Rp 1 M" diperiksa **sebelum** menerima bansos. Jika terpenuhi, hasil bersihnya bayar Rp 25 jt ke Kas Warkop.
- **W39 "Pinjam Seratus Dulu":** penerima adalah pemain termiskin **selain** pemain yang mengambil kartu.
- **W01 Kerja Bakti:** pemain termiskin dihitung dari semua pemain, termasuk yang mengambil kartu.
- **N33 Musim Mudik:** transportasi terdekat **di depan**. Jika belum dimiliki, boleh dibeli. Jika dimiliki pemain lain, bayar 2× sewa.
- **Asuransi Bencana:** saat kartu [Bencana] diambil, pemain memilih memakai asuransi atau menerima efeknya.
- **Lelang:** semua pemain aktif ikut, termasuk yang menolak membeli. Kenaikan tawaran minimal Rp 1 jt, tawaran pertama minimal Rp 10 jt.
- **Bangkrut ke pemain:** bangunan dijual ke Bank setengah harga dan uangnya diserahkan. Properti tergadai pindah tetap dalam status gadai, tanpa biaya tambahan.
- **Bangkrut harus dibuktikan:** tombol bangkrut hanya muncul jika uang + jual semua bangunan + gadai semua properti tetap tidak cukup.
- **Jual-beli & pinjam** hanya di luar proses giliran (sebelum lempar dadu atau sebelum selesai giliran), dan harus melibatkan pemain yang sedang giliran. Properti yang grup warnanya masih ada bangunan tidak bisa diperdagangkan.
- **Jatuh tempo utang:** utang dibuat di putaran *r*, jatuh tempo di putaran *r* + 3, ditagih di awal giliran peminjam.
- **Sewa utilitas karena kartu** memakai angka dadu terakhir.
- **Biaya tebus gadai** dihitung dengan bilangan bulat (nilai gadai + 10%, dibulatkan ke atas) agar bebas galat pembulatan.

## 3. Hasil simulasi bot (`npm run simulate`, 100 permainan per konfigurasi)

Bot memakai strategi "pemain wajar": beli jika masih punya cadangan Rp 150 jt, membeli petak terakhir dari pemain lain (1,5× harga) untuk melengkapi grup, lalu membangun. Hasil lengkap ada di `docs/simulasi-hasil.json`.

| Konfigurasi | Error | Selesai | Median putaran | Rata-rata giliran |
|---|---|---|---|---|
| Klasik 2 pemain | 0 | 100% | 73 | 153 |
| Klasik 4 pemain | 0 | 100% | 54 | 183 |
| Klasik 6 pemain | 0 | 100% | 46 | 228 |
| Kilat 4 pemain, 10 putaran | 0 | 100% | 10 | 40 |
| Kilat 4 pemain, 15 putaran | 0 | 100% | 15 | 58 |
| Kilat 4 pemain, 20 putaran | 0 | 100% | 20 | 75 |

**Perkiraan durasi.** Ini **asumsi, belum diuji**: satu giliran manusia memakan 30–45 detik.
- Klasik 4 pemain: sekitar 183 giliran, atau **±1,5–2,3 jam**. Sejalan dengan target 1,5–3 jam.
- Kilat 4 pemain, 15 putaran: sekitar 58 giliran, atau **±30–45 menit**. Sejalan dengan target ±45 menit.
- Angka ini wajib dikonfirmasi lewat playtest manusia (Bagian 11.4 dan 12).

## 4. Temuan balancing untuk diputuskan setelah playtest

1. **Tanpa jual-beli, permainan Klasik bisa buntu.** Pada simulasi awal tanpa jual-beli, 2 dari 3 permainan tidak selesai setelah lebih dari 800 putaran, karena properti tersebar dan tidak ada yang memiliki grup lengkap. Fitur jual-beli wajib dijelaskan ke pemain. Bisa dipertimbangkan aturan tambahan, misalnya lelang paksa.
2. **Kas Arisan bisa menumpuk besar.** Kas ini hanya bisa diambil lewat 1 dari 50 Kartu Warga (W02). Rata-rata puncaknya Rp 292 jt (Klasik 4 pemain). Pada permainan yang berlangsung lama, kas ini mencapai Rp 1,7 M. Ini bisa jadi "jackpot" yang seru, tetapi juga terlalu acak. Opsi: tambah 1 kartu "Narik Arisan!", atau beri batas maksimum Kas Arisan.
3. **Kas Warkop** rata-rata memuncak Rp 160–200 jt. Proporsinya wajar sebagai hadiah petak Warkop.
4. **Kekalahan di Mode Kilat jarang terjadi** (rata-rata 0,5 pemain bangkrut di 15 putaran), sehingga pemenang ditentukan total aset. Ini sesuai tujuan ice breaking.
