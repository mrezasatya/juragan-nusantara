# JURAGAN NUSANTARA
### Dokumen Konsep Game (Game Design Document) — Versi 0.2

> *"Dari Sabang sampai Merauke, semua bisa diborong... asal kuat bayar pajak, pungli, dan iuran RT."*

**Catatan perubahan v0.2**
- Nama game ditetapkan: **Juragan Nusantara**.
- Kartu Nasib dan Kartu Warga diperluas menjadi **50 kartu per dek** (25 positif : 25 sindiran).
- Sapaan dan ungkapan daerah dilengkapi. Provinsi yang istilahnya tidak bisa dipastikan akurat **tidak memakai bahasa daerah**.
- Ditambahkan mekanik **Kartu Simpan**, **tag Bencana**, dan **efek tertunda**.
- Ditambahkan Bagian 11.5–11.7: skema data dan prompt awal untuk build di **Claude Code**.

---

## 1. Ringkasan

| Aspek | Keputusan |
|---|---|
| Nama | **Juragan Nusantara** |
| Tagline | *"Borong Nusantara, asal kuat bayar iuran."* |
| Jenis | Board game ala Monopoli dengan tema khas Indonesia |
| Format | Web app (dimainkan di browser, HP/laptop/proyektor), dibangun dengan Claude Code |
| Tujuan | Hiburan pribadi/keluarga, konten media sosial, ice breaking & edukasi (kantor). **Tidak dijual** |
| Pemain | 2–6 pemain, remaja hingga dewasa (bukan untuk anak-anak) |
| Nada | Satir sedang yang jenaka, menyasar **fenomena umum**, bukan tokoh/partai/lembaga tertentu |
| Komposisi konten | 50% kebanggaan & kebaikan Indonesia : 50% sindiran |
| Papan | 22 provinsi dengan ikon wisata/budaya, rute Sabang → Merauke |
| Mata uang | Rupiah realistis (juta & miliar) |
| Bahasa | Bahasa Indonesia santai, diselingi istilah dan sapaan daerah |
| Visual | Kartun bernuansa tradisional lintas daerah (batik, songket, ulos, tenun ikat, motif Dayak, motif Papua, wayang) |
| Larangan konten | Tidak ada unsur SARA |

---

## 2. Prinsip Konten & Batasan Satir (Content Guardrails)

Prinsip ini berlaku untuk semua kartu, caption, dan konten tambahan di masa depan.

**Boleh:**
- Menyindir **sistem, perilaku, dan fenomena** (birokrasi, pungli, proyek mangkrak, "nunggu viral dulu", flexing, iuran tak jelas, jam karet).
- Menyindir **penanganan** bencana yang lambat atau tidak serius, serta perilaku yang memicu bencana (buang sampah sembarangan, alih fungsi hutan).
- Menyindir perilaku warga sendiri, termasuk pemain. Satir yang paling "aman" dan relate adalah yang juga menertawakan diri sendiri.
- Memakai istilah populer yang sudah umum seperti OTT, Hotel Prodeo, orang dalam, bansos, remisi, dan pinjol.

**Tidak boleh:**
- Menyebut nama tokoh, partai, pejabat, merek, atau lembaga tertentu. Gunakan kata generik seperti "oknum", "pejabat", atau "petugas".
- Stereotip suku, agama, ras, atau golongan, termasuk lelucon tentang watak orang daerah tertentu.
- Menjadikan **korban** bencana sebagai bahan lelucon.
- Menjadikan tempat ibadah, ritual, atau hari raya keagamaan sebagai objek sindiran. Istilah yang dipakai tetap generik, misalnya "hari raya" dan "musim mudik".
- Memakai nama, logo, atau desain visual "Monopoly", yang merupakan merek dagang Hasbro. Menyebut game ini "ala monopoli" sebagai deskripsi tetap wajar.

**Aturan istilah daerah:**
- Sapaan dan ungkapan daerah hanya dipakai dalam konteks **positif** (keramahan, kebersamaan, sambutan).
- Hanya istilah yang bisa dipastikan akurat yang dipakai. Jika tidak yakin, kartu properti cukup memuat fakta singkat tanpa bahasa daerah.

---

## 3. Tema Papan: Perjalanan Sabang → Merauke

Pemain "berkeliling Indonesia" dari barat ke timur. Ada 40 petak, sama seperti papan klasik 11×11.

**Logika harga:** harga properti naik mengikuti rute ke timur. Di dalam cerita game, ini dijelaskan sebagai **ongkos logistik ke timur yang makin mahal** dan **destinasi kelas dunia** seperti Raja Ampat. Buku aturan mencantumkan pernyataan: *harga di dalam game adalah mekanik permainan, bukan penilaian terhadap daerah atau warganya.*

### 3.1 Layout 40 Petak

| No | Petak | Jenis | Keterangan / Caption Jenaka |
|---|---|---|---|
| 0 | **MULAI — Tanggal Muda, Gajian!** | Spesial | Terima Rp 200 jt setiap lewat (setor Rp 10 jt ke Kas Arisan). *"Gaji numpang lewat."* |
| 1 | Aceh — Titik Nol Sabang | Properti (Kopi) | |
| 2 | Kartu Warga | Kartu | |
| 3 | Sumatra Utara — Danau Toba | Properti (Kopi) | |
| 4 | **Pajak Penghasilan** | Pajak | Bayar Rp 200 jt **atau** 10% total aset. *"Hitung sendiri, lapor sendiri, bayar sendiri, ditegur juga sendiri."* |
| 5 | **Terminal Bus Antarkota** | Transportasi | *"Calo menyambut dengan ramah."* |
| 6 | Sumatra Barat — Jam Gadang | Properti (Langit) | |
| 7 | Kartu Nasib | Kartu | |
| 8 | Sumatra Selatan — Jembatan Ampera | Properti (Langit) | |
| 9 | Bangka Belitung — Pantai Tanjung Tinggi | Properti (Langit) | |
| 10 | **Hotel Prodeo / Cuma Mampir** | Spesial | Penjara. *"Kamar ber-AC, sofa empuk, katanya sih."* |
| 11 | Banten — Ujung Kulon | Properti (Jambu) | |
| 12 | **Token Listrik** | Utilitas | *"Bunyi tit-tit pas tengah malam."* |
| 13 | Jawa Barat — Gedung Sate | Properti (Jambu) | |
| 14 | DKI Jakarta — Monas | Properti (Jambu) | |
| 15 | **Stasiun Kereta** | Transportasi | *"Rebutan kursi adalah olahraga nasional."* |
| 16 | DI Yogyakarta — Malioboro | Properti (Jeruk) | |
| 17 | Kartu Warga | Kartu | |
| 18 | Jawa Tengah — Lawang Sewu | Properti (Jeruk) | |
| 19 | Jawa Timur — Gunung Bromo | Properti (Jeruk) | |
| 20 | **Ngopi Dulu di Warkop** | Spesial | Ambil seluruh isi **Kas Warkop**. *"Semua masalah bangsa dibahas tuntas di sini. Solusinya besok."* |
| 21 | Bali — Ubud | Properti (Cabai) | |
| 22 | Kartu Nasib | Kartu | |
| 23 | Nusa Tenggara Barat — Gunung Rinjani | Properti (Cabai) | |
| 24 | Nusa Tenggara Timur — Labuan Bajo | Properti (Cabai) | |
| 25 | **Pelabuhan Penyeberangan** | Transportasi | *"Antre kendaraan berjam-jam tiap musim liburan."* |
| 26 | Kalimantan Barat — Tugu Khatulistiwa | Properti (Kunyit) | |
| 27 | Kalimantan Selatan — Pasar Terapung Lok Baintan | Properti (Kunyit) | |
| 28 | **Air Bersih** | Utilitas | *"Airnya mengalir... kadang-kadang."* |
| 29 | Kalimantan Timur — Kepulauan Derawan | Properti (Kunyit) | |
| 30 | **KENA OTT! Masuk Hotel Prodeo** | Spesial | Langsung ke petak 10 tanpa lewat MULAI. *"Tadi malam masih senyum di baliho."* |
| 31 | Sulawesi Selatan — Pantai Losari | Properti (Pandan) | |
| 32 | Sulawesi Utara — Taman Laut Bunaken | Properti (Pandan) | |
| 33 | **Pos Pungli** | Spesial | Lihat mekanik 5.2. *"Seikhlasnya, tapi ada tarifnya."* |
| 34 | Sulawesi Tenggara — Wakatobi | Properti (Pandan) | |
| 35 | **Bandara** | Transportasi | *"Delay? Biasa, Kak."* |
| 36 | Kartu Nasib | Kartu | |
| 37 | Maluku — Banda Neira | Properti (Nila) | |
| 38 | **Pajak Flexing** | Pajak | Bayar Rp 100 jt. *"Pamer mobil mewah di medsos, harta kekayaan langsung diperiksa."* |
| 39 | Papua Barat Daya — Raja Ampat | Properti (Nila) | |

**Komposisi:** 22 properti, 4 transportasi, 2 utilitas, 2 petak pajak, 5 petak kartu (3 Kartu Nasib dan 2 Kartu Warga), serta 5 petak spesial (MULAI, Hotel Prodeo, Warkop, OTT, Pos Pungli).

---

## 4. Data Properti

### 4.1 Grup Warna

| Grup | Warna | Wilayah | Motif bingkai kartu | Biaya bangun per Homestay/Resort |
|---|---|---|---|---|
| **Kopi** | Coklat | Sumatra bagian utara | Motif Pintu Aceh & ulos | Rp 50 jt |
| **Langit** | Biru muda | Sumatra bagian tengah-selatan | Songket | Rp 50 jt |
| **Jambu** | Merah muda | Jawa bagian barat | Batik mega mendung & motif Betawi | Rp 100 jt |
| **Jeruk** | Oranye | Jawa bagian tengah-timur | Batik parang & kawung | Rp 100 jt |
| **Cabai** | Merah | Bali & Nusa Tenggara | Endek & tenun ikat | Rp 150 jt |
| **Kunyit** | Kuning | Kalimantan | Motif Dayak | Rp 150 jt |
| **Pandan** | Hijau | Sulawesi | Tenun sutra Bugis & motif pinisi | Rp 200 jt |
| **Nila** | Biru tua | Maluku & Papua | Motif ukiran Papua & cengkih-pala | Rp 200 jt |

### 4.2 Tabel Harga & Sewa (semua dalam juta Rupiah)

Bangunan: **Homestay** (setara rumah, maksimal 4) lalu **Resort** (setara hotel).

| Petak | Properti | Harga | Sewa dasar | 1 Homestay | 2 Homestay | 3 Homestay | 4 Homestay | Resort | Nilai gadai |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Aceh — Titik Nol Sabang | 60 | 2 | 10 | 30 | 90 | 160 | 250 | 30 |
| 3 | Sumut — Danau Toba | 60 | 4 | 20 | 60 | 180 | 320 | 450 | 30 |
| 6 | Sumbar — Jam Gadang | 100 | 6 | 30 | 90 | 270 | 400 | 550 | 50 |
| 8 | Sumsel — Jembatan Ampera | 100 | 6 | 30 | 90 | 270 | 400 | 550 | 50 |
| 9 | Babel — Pantai Tanjung Tinggi | 120 | 8 | 40 | 100 | 300 | 450 | 600 | 60 |
| 11 | Banten — Ujung Kulon | 140 | 10 | 50 | 150 | 450 | 625 | 750 | 70 |
| 13 | Jabar — Gedung Sate | 140 | 10 | 50 | 150 | 450 | 625 | 750 | 70 |
| 14 | DKI Jakarta — Monas | 160 | 12 | 60 | 180 | 500 | 700 | 900 | 80 |
| 16 | DIY — Malioboro | 180 | 14 | 70 | 200 | 550 | 750 | 950 | 90 |
| 18 | Jateng — Lawang Sewu | 180 | 14 | 70 | 200 | 550 | 750 | 950 | 90 |
| 19 | Jatim — Gunung Bromo | 200 | 16 | 80 | 220 | 600 | 800 | 1.000 | 100 |
| 21 | Bali — Ubud | 220 | 18 | 90 | 250 | 700 | 875 | 1.050 | 110 |
| 23 | NTB — Gunung Rinjani | 220 | 18 | 90 | 250 | 700 | 875 | 1.050 | 110 |
| 24 | NTT — Labuan Bajo | 240 | 20 | 100 | 300 | 750 | 925 | 1.100 | 120 |
| 26 | Kalbar — Tugu Khatulistiwa | 260 | 22 | 110 | 330 | 800 | 975 | 1.150 | 130 |
| 27 | Kalsel — Pasar Terapung Lok Baintan | 260 | 22 | 110 | 330 | 800 | 975 | 1.150 | 130 |
| 29 | Kaltim — Kepulauan Derawan | 280 | 24 | 120 | 360 | 850 | 1.025 | 1.200 | 140 |
| 31 | Sulsel — Pantai Losari | 300 | 26 | 130 | 390 | 900 | 1.100 | 1.275 | 150 |
| 32 | Sulut — Taman Laut Bunaken | 300 | 26 | 130 | 390 | 900 | 1.100 | 1.275 | 150 |
| 34 | Sultra — Wakatobi | 320 | 28 | 150 | 450 | 1.000 | 1.200 | 1.400 | 160 |
| 37 | Maluku — Banda Neira | 350 | 35 | 175 | 500 | 1.100 | 1.300 | 1.500 | 175 |
| 39 | Papua Barat Daya — Raja Ampat | 400 | 50 | 200 | 600 | 1.400 | 1.700 | 2.000 | 200 |

> Angka sewa mengikuti proporsi papan klasik yang sudah teruji keseimbangannya, dengan skala Rp 1 juta per 1 unit. Sewa dasar menjadi **2×** jika pemain memiliki satu grup warna lengkap tanpa bangunan.

### 4.3 Transportasi & Utilitas

| Petak | Harga | Sewa |
|---|---|---|
| Terminal Bus, Stasiun Kereta, Pelabuhan, Bandara | Rp 200 jt per unit | Punya 1: Rp 25 jt · 2: Rp 50 jt · 3: Rp 100 jt · 4: Rp 200 jt |
| Token Listrik, Air Bersih | Rp 150 jt per unit | Punya 1: angka dadu × Rp 4 jt · Punya 2: angka dadu × Rp 10 jt |

### 4.4 Isi Kartu Properti

Setiap kartu properti memuat ilustrasi ikon, satu fakta positif singkat, dan, jika ada, sapaan atau ungkapan daerah sebagai unsur keramahan.

| Properti | Fakta singkat | Sapaan / ungkapan daerah |
|---|---|---|
| Aceh — Titik Nol Sabang | Titik paling barat Indonesia, di Pulau Weh | *"Peumulia jamee adat geutanyoe."* (Memuliakan tamu adalah adat kami.) |
| Sumut — Danau Toba | Danau vulkanik terbesar di dunia | *"Horas!"* |
| Sumbar — Jam Gadang | Ikon Kota Bukittinggi | *"Baa kaba, Sanak?"* (Apa kabar, Saudara?) |
| Sumsel — Jembatan Ampera | Ikon Palembang, membentang di atas Sungai Musi | *"Wong kito galo!"* (Kita semua saudara!) |
| Babel — Pantai Tanjung Tinggi | Pantai dengan batu granit raksasa di Belitung | Semboyan provinsi: *"Serumpun Sebalai"* |
| Banten — Ujung Kulon | Habitat terakhir badak Jawa | *"Sampurasun!"* (salam khas Sunda yang juga digunakan di Banten) |
| Jabar — Gedung Sate | Ikon Kota Bandung | *"Wilujeng sumping!"* (Selamat datang!) |
| DKI — Monas | Ikon ibu kota | *"Ape kabar, Bang? Mampir dulu, aye traktir kerak telor!"* |
| DIY — Malioboro | Jantung wisata Yogyakarta | *"Monggo pinarak."* (Silakan mampir.) |
| Jateng — Lawang Sewu | Gedung bersejarah "seribu pintu" di Semarang | *"Sugeng rawuh!"* (Selamat datang!) |
| Jatim — Gunung Bromo | Lautan pasir dan matahari terbit yang terkenal | *"Ayo, Rek!"* |
| Bali — Ubud | Sawah terasering dan pusat seni | *"Suksma!"* (Terima kasih!) |
| NTB — Gunung Rinjani | Gunung api tertinggi kedua di Indonesia | *"Tampi asih!"* (Terima kasih!, bahasa Sasak) |
| NTT — Labuan Bajo | Gerbang menuju habitat komodo | — |
| Kalbar — Tugu Khatulistiwa | Kota yang dilintasi garis khatulistiwa | Semboyan provinsi: *"Akcaya"* |
| Kalsel — Pasar Terapung Lok Baintan | Jual beli di atas perahu sejak subuh | *"Kayapa kabar?"* (Apa kabar?) |
| Kaltim — Kepulauan Derawan | Surga penyu dan danau ubur-ubur tanpa sengat | Semboyan provinsi: *"Ruhui Rahayu"* |
| Sulsel — Pantai Losari | Ikon Makassar, kota para pelaut pinisi | *"Ewako!"* (Semangat!) |
| Sulut — Taman Laut Bunaken | Salah satu taman laut terbaik dunia | *"Torang samua basudara!"* (Kita semua bersaudara!) |
| Sultra — Wakatobi | Kawasan terumbu karang kelas dunia | — |
| Maluku — Banda Neira | Pulau pala yang dulu diperebutkan dunia | *"Ale rasa beta rasa."* (Kamu merasa, aku pun merasa.) |
| Papua Barat Daya — Raja Ampat | Pusat keanekaragaman hayati laut dunia | *"Mari, Kaka!"* |

> NTT dan Sultra sengaja tanpa bahasa daerah karena keragaman bahasanya tinggi dan istilah yang tepat untuk lokasi ikonnya tidak bisa dipastikan.

---

## 5. Mekanik Khas Indonesia

Aturan dasar (lempar dadu, beli, sewa, bangun, gadai, lelang) tetap seperti board game properti pada umumnya. Mekanik berikut adalah tambahan khas Juragan Nusantara.

### 5.1 Dua Kas Rakyat
| Kas | Sumber dana | Cara mengambil |
|---|---|---|
| **Kas Warkop** | Semua **denda, pungli, dan iuran** yang ditandai "ke Kas Warkop" di kartu, serta Pos Pungli dan denda Hotel Prodeo | Berhenti di petak 20 **Ngopi Dulu di Warkop** → ambil semua isinya |
| **Kas Arisan** | Setiap kali lewat MULAI, pemain menyetor **Rp 10 jt iuran arisan** | Mendapat Kartu Warga **"Narik Arisan!"** → ambil semua isinya |

> Pajak dan pembayaran biasa masuk ke **Bank (kas negara)**. Hanya yang bertanda "ke Kas Warkop" yang masuk Kas Warkop. *Pajak masuk kas negara, pungli masuk kas warkop.* Selain lucu, aturan ini menahan jumlah uang yang beredar supaya permainan tidak berlarut-larut.

### 5.2 Pos Pungli (petak 33)
Pemain yang berhenti di sini memilih salah satu:
- **Bayar "uang rokok"** Rp 20 jt ke Kas Warkop, atau
- **Nego dulu**: lempar 1 dadu.
  - 1–2: *"Petugas tersinggung."* Bayar Rp 40 jt.
  - 3–4: *"Ya sudah, tarif normal."* Bayar Rp 20 jt.
  - 5–6: *"Petugasnya lagi baik hati."* Lolos gratis.
- Pemegang **Kartu Orang Dalam** boleh lolos tanpa bayar (kartu dikembalikan ke dek).

### 5.3 Hotel Prodeo (penjara)
Cara masuk: berhenti di petak 30 **KENA OTT!**, mendapat kartu "Kena OTT", atau melempar dobel 3 kali berturut-turut (*"Ngebut terus, dicurigai."*).

Cara keluar (pilih salah satu):
1. Bayar **denda Rp 50 jt** ke Kas Warkop,
2. Lempar dobel (maksimal 3 giliran; jika gagal, wajib bayar denda),
3. Pakai **Kartu Remisi 17 Agustus**, atau
4. Pakai **Kartu Orang Dalam**.

> Selama di Hotel Prodeo, pemain **tetap boleh menagih sewa**. *"Bisnis jalan terus dari balik jeruji."*

### 5.4 Utang ke Tetangga (pinjam antarpemain)
- Pemain boleh meminjam uang ke pemain lain dengan kesepakatan bebas, dengan bunga maksimal 10%.
- Jika tidak dilunasi dalam **3 putaran**, peminjam **"ditagih di grup chat RT"**: wajib melunasi saat itu juga ditambah denda 10%. Jika uangnya tidak cukup, ia menyerahkan properti senilai utangnya.

### 5.5 Lelang Pasar Tradisional
Jika pemain menolak membeli properti, properti itu dilelang ke semua pemain dengan **tawar-menawar** mulai Rp 10 jt.

### 5.6 Mekanik "Pengejaran" (catch-up)
Kartu seperti **Kerja Bakti**, **Bansos**, dan **"Pinjam Seratus Dulu"** mengalirkan dana kepada pemain dengan uang paling sedikit. Mekanik ini mencegah satu pemain terlalu dominan, sekaligus menjadi wujud nilai gotong royong.

### 5.7 Kartu Simpan (item)
Kartu jenis ini **tidak langsung dikembalikan** ke dek. Pemain menyimpannya dan boleh memakainya kapan saja sesuai fungsinya, lalu kartu kembali ke bagian bawah dek asalnya. Kartu simpan boleh diperjualbelikan antarpemain.

| Kartu simpan | Asal dek | Jumlah | Fungsi |
|---|---|---|---|
| Remisi 17 Agustus | Kartu Nasib | 1 | Keluar dari Hotel Prodeo |
| Kartu Orang Dalam | Kartu Warga | 1 | Keluar dari Hotel Prodeo **atau** lolos Pos Pungli |
| Asuransi Bencana | Kartu Nasib (1) & Kartu Warga (1) | 2 | Membatalkan efek 1 kartu bertanda **[Bencana]** |

### 5.8 Kartu Bertanda [Bencana]
Kartu bencana menyindir **penyebab dan penanganan**, bukan korban. Efeknya bisa dibatalkan dengan kartu **Asuransi Bencana**. Daftarnya: N29 Musim Kabut Asap, N30 Banjir Kiriman, N36 Tanah Longsor.

### 5.9 Efek Tertunda
Beberapa kartu memiliki efek yang berlaku belakangan (contoh: N50 Iklan Pinjol). Di web app, efek ini dicatat sebagai **tanggungan pemain** dan otomatis ditagih ketika syaratnya terpenuhi.

### 5.10 Aturan Umum Kartu
- Kartu "maju ke [petak]": jika melewati MULAI, pemain menerima gaji seperti biasa. Pengecualiannya adalah kartu OTT (langsung masuk Hotel Prodeo) dan W41 (berhenti di MULAI tanpa gaji).
- Jika pemain tiba di properti milik pemain lain karena kartu, ia membayar sewa normal, kecuali kartu menyebut ketentuan lain.
- Kartu "diam 1 giliran" berarti pemain melewatkan giliran berikutnya.
- Jika dek habis, kartu yang sudah dipakai dikocok ulang (kartu simpan yang masih dipegang pemain tidak ikut dikocok).

---

## 6. Daftar Kartu

Setiap dek berisi **50 kartu: 25 kebaikan Indonesia (🇮🇩) dan 25 sindiran (😏)**. Semua nominal dalam juta Rupiah ("jt"). Tanpa keterangan tujuan, pembayaran masuk ke **Bank**.

### 6.1 KARTU NASIB (peristiwa, keberuntungan, dan fenomena nasional)

#### A. Kebaikan Indonesia (25)

| ID | Judul | Teks kartu | Efek |
|---|---|---|---|
| N01 | Kontenmu Viral! | Video kamu masak rendang ditonton jutaan orang. Endorse berdatangan. | Terima Rp 50 jt |
| N02 | Turis Mancanegara Kepincut | Homestay-mu dapat ulasan bintang lima: "Warganya ramah sekali!" | Terima Rp 30 jt |
| N03 | Nobar Final Bulu Tangkis | Indonesia juara, warung kopimu laris sampai subuh. | Terima Rp 20 jt |
| N04 | Pameran Budaya Dunia | Batik, wayang, dan angklung tampil di panggung internasional. | Maju ke DIY — Malioboro |
| N05 | Mudik Lancar Jaya | Jalanan lengang, sampai kampung tepat waktu. Tumben. | Maju ke MULAI, terima gaji |
| N06 | Panen Raya | Sawah dan kebun panen melimpah. | Terima Rp 25 jt |
| N07 | Liburan ke Timur | Saatnya melihat surga di ujung timur. | Maju ke Raja Ampat |
| N08 | Juara Panjat Pinang 17-an | Kerja sama tim, hadiahnya dibagi rata. | Terima Rp 15 jt |
| N09 | Asuransi Bencana | Sedia payung sebelum hujan. | **Simpan.** Batalkan 1 kartu [Bencana] |
| N10 | Desa Wisata Terbaik | Kampungmu dinobatkan sebagai desa wisata terbaik. | Terima Rp 40 jt |
| N11 | UMKM Naik Kelas | Keripik buatanmu tembus pasar ekspor. | Terima Rp 60 jt |
| N12 | Jalan Tol Baru Diresmikan | Perjalanan antarkota jadi jauh lebih cepat. | Maju 4 petak |
| N13 | Menyelam di Bunaken | Terumbu karangnya bikin lupa pulang. | Maju ke Taman Laut Bunaken |
| N14 | Festival Kuliner Nusantara | Stan makananmu antre panjang dari pagi sampai malam. | Terima Rp 35 jt |
| N15 | Anak Dapat Beasiswa | Anakmu lulus seleksi beasiswa penuh. Biaya kuliah aman. | Terima Rp 40 jt |
| N16 | Pentas Angklung Keliling Dunia | Grup angklung kampungmu diundang tampil di luar negeri. | Terima Rp 25 jt |
| N17 | Pesta Rakyat | Pasar malam, panggung hiburan, semua orang gembira. | **Semua pemain** terima Rp 10 jt |
| N18 | Pinisi Berlayar | Ikut pelayaran kapal pinisi menyusuri pesisir. | Maju ke Pantai Losari |
| N19 | Matahari Terbit di Bromo | Bangun jam 3 pagi, tapi pemandangannya sepadan. | Maju ke Gunung Bromo |
| N20 | Kejadian Langka | Harga BBM turun. Semua orang curiga, tapi senang. | Terima Rp 20 jt |
| N21 | Kopi Lokal Juara Dunia | Biji kopi dari kebunmu menang kompetisi internasional. | Terima Rp 45 jt |
| N22 | Pentas Wayang Semalam Suntuk | Penonton membludak, angkringanmu laku keras. | Terima Rp 20 jt |
| N23 | Relawan Tanggap Bencana | Kamu turun langsung membantu warga terdampak. Perusahaan memberi bonus kepedulian. | Terima Rp 25 jt |
| N24 | Spesies Baru Ditemukan | Peneliti menemukan spesies baru di hutan dekat kampungmu. Ekowisata ramai. | Terima Rp 30 jt |
| N25 | Tenun Ikat Mendunia | Pesanan kain tenun datang dari mancanegara. | Terima Rp 30 jt |

#### B. Sindiran (25)

| ID | Judul | Teks kartu | Efek |
|---|---|---|---|
| N26 | KENA OTT! | Proyek jembatanmu ternyata cuma jadi di gambar. | Langsung masuk Hotel Prodeo, tidak lewat MULAI |
| N27 | Remisi 17 Agustus | Berkelakuan baik, katanya. | **Simpan.** Keluar dari Hotel Prodeo |
| N28 | Macet Total | Jarak 5 km, waktu tempuh 3 jam. | Diam 1 giliran, **atau** bayar ojek Rp 5 jt untuk tetap jalan |
| N29 | Musim Kabut Asap **[Bencana]** | Lahan dibakar, asap ke mana-mana, penanganannya nunggu viral dulu. | Mundur 3 petak dan beli masker Rp 5 jt (ke Kas Warkop) |
| N30 | Banjir Kiriman **[Bencana]** | Got mampet, drainase cuma wacana. | Bayar Rp 25 jt per Homestay dan Rp 100 jt per Resort milikmu |
| N31 | Tilang Motor Lama | Kena tilang elektronik untuk motor yang sudah dijual 3 tahun lalu. | Bayar Rp 10 jt (ke Kas Warkop) |
| N32 | Harga Cabai Naik Lagi | Masak sambal sekarang butuh cicilan. | Bayar Rp 15 jt |
| N33 | Musim Mudik | Tiket naik dua kali lipat, calo naik tiga kali lipat. | Maju ke petak transportasi terdekat. Jika dimiliki pemain lain, bayar **2×** sewa |
| N34 | Proyek Mangkrak | Tiang beton berdiri sendirian bertahun-tahun, jadi monumen kenangan. | Bayar Rp 40 jt |
| N35 | Pembangunan Kejar Tayang | Jembatan diresmikan hari ini, besok ditutup untuk perbaikan. | Mundur 3 petak |
| N36 | Tanah Longsor **[Bencana]** | Hutan di bukit sudah berganti vila. | Bayar Rp 15 jt per Homestay dan Rp 60 jt per Resort milikmu |
| N37 | Sungai Jadi Tempat Sampah | Kamu ketahuan buang sampah ke sungai. Pantas tiap tahun banjir. | Bayar denda Rp 15 jt (ke Kas Warkop) |
| N38 | Baliho di Mana-mana | Papan penunjuk jalan tertutup baliho raksasa. Kamu nyasar. | Mundur 2 petak |
| N39 | Tender Sudah Ada Pemenangnya | Kamu ikut tender, ternyata pemenangnya sudah diketahui sebelum dibuka. | Biaya proposal hangus, bayar Rp 20 jt |
| N40 | Mark-up Ketahuan | Harga kursi kantor di laporan setara harga mobil. | Kembalikan kelebihan, bayar Rp 50 jt |
| N41 | Studi Banding (Katanya) | Agendanya rapat satu jam, belanjanya tiga hari. | Maju ke Bandara. Jika dimiliki pemain lain, bayar sewa |
| N42 | Tukang Parkir Gaib | Datang tidak ada, pergi tiba-tiba muncul: "Terus, terus, kiri!" | Bayar Rp 5 jt (ke Kas Warkop) |
| N43 | Tiket Domestik Lebih Mahal | Terbang ke pulau sebelah lebih mahal daripada ke luar negeri. | Bayar Rp 25 jt |
| N44 | Solar Langka | Antre di pom bensin dari subuh, dapatnya setengah tangki. | Diam 1 giliran |
| N45 | Rapat Koordinasi ke-17 | Rapat penanganan bencana untuk membahas jadwal rapat berikutnya. | Diam 1 giliran |
| N46 | Tarif Naik, Layanan Tetap | Biaya naik terus, pelayanannya begitu-begitu saja. | Bayar Rp 30 jt |
| N47 | Satu Tanah Dua Sertifikat | Tanahmu ternyata punya "kembaran" di kantor lain. | Bayar biaya sengketa Rp 30 jt |
| N48 | Galian Bolak-balik | Jalan digali untuk kabel, ditutup, lalu digali lagi untuk pipa. | Bayar Rp 10 jt untuk ban bocor |
| N49 | Destinasi Indah, Sinyal Hilang | Tamu batal menginap karena tidak bisa unggah foto. | Bayar Rp 15 jt |
| N50 | Iklan Pinjol Menggoda | "Cair 5 menit, tanpa jaminan!" Bunganya tidak bilang-bilang. | Terima Rp 50 jt sekarang, **bayar Rp 75 jt saat lewat MULAI berikutnya** (efek tertunda) |

### 6.2 KARTU WARGA (kehidupan bertetangga dan bermasyarakat)

#### A. Kebaikan Indonesia (25)

| ID | Judul | Teks kartu | Efek |
|---|---|---|---|
| W01 | Kerja Bakti | Satu RT turun tangan membantu warga yang sedang susah. | Pemain dengan uang **paling sedikit** menerima Rp 10 jt dari setiap pemain lain |
| W02 | Narik Arisan! | Namamu keluar di kocokan arisan. | Ambil semua isi Kas Arisan |
| W03 | Kamu Hajatan | Tetangga datang membawa amplop dan doa terbaik. | Terima Rp 10 jt dari setiap pemain |
| W04 | Tetangga Antar Makanan | Tetangga masak besar dan kamu kebagian. Hemat belanja seminggu. | Terima Rp 10 jt |
| W05 | Dapat THR | Tunjangan hari raya cair tepat waktu. | Terima Rp 50 jt |
| W06 | Oleh-oleh Laris | Jualan oleh-oleh khas daerah habis diborong. | Terima Rp 20 jt |
| W07 | Kampung Juara Kebersihan | Hasil gotong royong warga satu kampung. | Terima Rp 25 jt |
| W08 | SHU Koperasi Cair | Sisa hasil usaha koperasi dibagikan ke anggota. | Terima Rp 30 jt |
| W09 | Siskamling Sukses | Ronda malam rutin, kampung aman, tidak perlu sewa satpam. | Terima Rp 15 jt |
| W10 | Kader Posyandu Teladan | Balita di kampungmu sehat semua. | Terima penghargaan Rp 15 jt |
| W11 | Pindahan Dibantu Satu Gang | Tidak perlu sewa jasa angkut, tetangga turun semua. | Terima Rp 20 jt |
| W12 | Juara Balap Karung | Latihan di gang ternyata membuahkan hasil. | Terima Rp 10 jt |
| W13 | Liwetan Bersama | Makan bersama di atas daun pisang, semua kenyang. | **Semua pemain** terima Rp 5 jt |
| W14 | Tabungan Bank Sampah Cair | Rajin memilah sampah ternyata menguntungkan. | Terima Rp 15 jt |
| W15 | Anak Juara Olimpiade Sains | Anak tetangga belajar bareng anakmu, dua-duanya juara. | Terima Rp 30 jt |
| W16 | Bon Warung Diputihkan | Bu warung menghapus catatan bonmu karena kamu rajin membantu. | Terima Rp 10 jt |
| W17 | Ojek Langganan Jujur | Dompetmu ketinggalan di motor, dikembalikan utuh. | Terima Rp 20 jt |
| W18 | Gotong Royong Bedah Rumah | Warga bergotong royong merenovasi rumahmu. | Bangun 1 Homestay gratis di grup warna lengkap milikmu. Jika tidak punya, terima Rp 30 jt |
| W19 | Warisan Kebun Durian | Kakek mewariskan kebun yang sedang musim panen. | Terima Rp 40 jt |
| W20 | Juara Masak Nasi Goreng | Lomba antar-RT, resep rahasia keluarga menang telak. | Terima Rp 15 jt |
| W21 | Reuni Bawa Rezeki | Teman lama mengajak kerja sama bisnis. | Terima Rp 35 jt |
| W22 | Gotong Royong Panen | Tetangga membantu panen, upah buruh hemat. | Terima Rp 20 jt |
| W23 | Kampung Bebas Banjir | Warga rutin membersihkan selokan. Hujan deras pun aman. | **Simpan sebagai Asuransi Bencana.** Batalkan 1 kartu [Bencana] |
| W24 | Promo Tanggal Kembar | Kebutuhan rumah tangga diskon setengah harga. | Terima Rp 10 jt |
| W25 | Silaturahmi Keliling Kampung | Perut kenyang, hubungan makin erat, dompet tetap utuh. | Terima Rp 10 jt |

#### B. Sindiran (25)

| ID | Judul | Teks kartu | Efek |
|---|---|---|---|
| W26 | Kartu Orang Dalam | "Tenang, saya kenal orangnya." | **Simpan.** Keluar dari Hotel Prodeo **atau** lolos Pos Pungli |
| W27 | Utang Ditagih di Grup Chat RT | Lupa bayar utang ke tetangga, sekarang satu RT tahu. | Bayar Rp 20 jt ke pemain di sebelah kirimu |
| W28 | Bansos Salah Sasaran | Bansos cair. Tapi, eh, kok kamu dapat? | Terima Rp 25 jt. Jika uangmu di atas Rp 1 M, kembalikan dan bayar denda malu Rp 25 jt (ke Kas Warkop) |
| W29 | Urus KTP: "Sistem Offline" | "Datang lagi besok ya, Pak/Bu." | Diam 1 giliran |
| W30 | Kondangan 3 Kali Seminggu | Undangan datang beruntun, gaji belum turun. | Bayar amplop Rp 15 jt |
| W31 | Pemadaman Bergilir | Listrik padam pas lagi rapat online. | Bayar sewa genset Rp 10 jt |
| W32 | Iuran Tak Terduga | Iuran 17-an, iuran ronda, iuran sampah, iuran entah apa. | Bayar Rp 10 jt (ke Kas Warkop) |
| W33 | No Viral No Justice | Laporan jalan rusakmu tidak ditanggapi. | Lempar dadu. Genap: viral, langsung diperbaiki, terima kompensasi Rp 20 jt. Ganjil: tetap diabaikan, bayar kuota Rp 5 jt |
| W34 | Panci Dipinjam Setahun | Tetangga pinjam panci, kembalinya entah kapan. | Beli panci baru, bayar Rp 5 jt |
| W35 | Hoaks di Grup Keluarga | Kamu ikut menyebarkan info palsu, sekarang sibuk klarifikasi. | Diam 1 giliran |
| W36 | Gerbang Dihalangi Mobil Tetangga | Mobil tetangga parkir pas di depan gerbangmu. | Naik ojek, bayar Rp 5 jt |
| W37 | Hajatan Sampai Subuh | Sound system tetangga menggelegar sampai pagi. Kamu kurang tidur. | Mundur 2 petak |
| W38 | Iuran Sampah, Sampahnya Menginap | Iuran rutin dibayar, sampahnya tidak diangkut seminggu. | Bayar Rp 10 jt (ke Kas Warkop) |
| W39 | "Pinjam Seratus Dulu" | Teman lama tiba-tiba chat setelah 5 tahun menghilang. | Bayar Rp 10 jt ke pemain dengan uang **paling sedikit** |
| W40 | Debt Collector Salah Alamat | Yang berutang siapa, yang ditagih siapa. | Diam 1 giliran |
| W41 | Surat Pengantar Berputar | Dari RT ke RW ke kelurahan, kembali lagi ke RT karena stempel kurang. | Pindah ke MULAI **tanpa** menerima gaji |
| W42 | Fotokopi 10 Rangkap | Katanya sudah serba digital. | Bayar Rp 5 jt |
| W43 | Uang Keamanan "Oknum" | Kios barumu didatangi "penjaga lingkungan" tak dikenal. | Bayar Rp 15 jt (ke Kas Warkop) |
| W44 | Ikut-ikutan Flexing | Tetangga pamer mobil baru (kredit). Kamu tidak mau kalah. | Bayar Rp 30 jt |
| W45 | Arisan Bodong | Bandar arisan menghilang bersama uangnya. | Seluruh isi Kas Arisan hangus (kembali ke Bank) |
| W46 | Investasi Bodong | Dijanjikan untung 30% per bulan, tanpa risiko. | Bayar Rp 50 jt |
| W47 | Jam Karet Rapat RT | Undangan jam 7, mulai jam 9, selesai jam 11. | Mundur 3 petak |
| W48 | Antre Berobat dari Subuh | Dapat nomor antrean 187. | Diam 1 giliran |
| W49 | Servis "Cuma Ganti Kabel" | Tagihannya kok seharga barang baru? | Bayar Rp 15 jt |
| W50 | Dipilih Jadi Panitia Saat Absen | Tidak datang rapat, terpilih secara aklamasi, wajib menalangi dana. | Bayar Rp 20 jt (ke Kas Warkop) |

---

## 7. Aturan Main Ringkas

**Persiapan**
- Setiap pemain menerima **Rp 1,5 M**.
- Pecahan uang: Rp 1 jt, 5 jt, 10 jt, 20 jt, 50 jt, 100 jt, 500 jt.
- Bank dijalankan oleh **Bendahara Koperasi** (di web app dijalankan otomatis).
- Kocok Kartu Nasib dan Kartu Warga secara terpisah.

**Giliran**
1. Lempar 2 dadu dan maju sesuai jumlah mata dadu.
2. Berhenti di properti tak bertuan: beli sesuai harga, atau properti dilelang.
3. Berhenti di properti milik pemain lain: bayar sewa.
4. Lempar dobel: main lagi. Dobel 3 kali berturut-turut: masuk Hotel Prodeo.

**Membangun**
- Hanya boleh membangun jika memiliki satu grup warna lengkap.
- Pembangunan harus merata (selisih jumlah Homestay antarpetak dalam satu grup maksimal 1).
- 4 Homestay dapat ditingkatkan menjadi 1 Resort.

**Gadai**
- Gadaikan properti ke Bank untuk mendapat 50% harganya.
- Tebus kembali dengan nilai gadai + 10%.
- Properti yang digadaikan tidak menghasilkan sewa.

**Bangkrut**
- Jika tidak mampu membayar setelah menjual bangunan (setengah harga) dan menggadaikan properti, pemain bangkrut.
- Asetnya diserahkan kepada pihak yang ditagihnya (Bank atau pemain).

**Pemenang**
- Pemain terakhir yang belum bangkrut (Mode Klasik), atau
- Total aset terbesar ketika permainan selesai (Mode Kilat).

---

## 8. Mode Permainan

| Mode | Untuk siapa | Durasi | Perbedaan aturan |
|---|---|---|---|
| **Klasik** | Main santai bersama keluarga atau teman | 1,5–3 jam | Aturan penuh, menang jika semua lawan bangkrut |
| **Kilat** ⭐ | Ice breaking di kantor, sesi singkat | 30–60 menit | Setiap pemain mendapat 2 properti acak di awal. Permainan selesai setelah batas putaran atau waktu (bisa diatur). Pemenang ditentukan dari total aset (uang + harga properti + bangunan) |
| **Edukasi Nusantara** | Ice breaking dan edukasi | Fleksibel | Saat berhenti di provinsi yang belum dimiliki, pemain boleh menjawab 1 kuis tentang provinsi itu. Jawaban benar memberi **diskon 20%** harga beli |

**Contoh soal Kuis Nusantara:**
- Jam Gadang berada di kota apa? → Bukittinggi
- Hewan langka apa yang dilindungi di Ujung Kulon? → Badak Jawa (bercula satu)
- Pasar Terapung Lok Baintan ada di provinsi mana? → Kalimantan Selatan

> Untuk konteks kantor, Mode Kilat paling realistis. Board game properti terkenal lama dan sering berakhir dengan satu pemain mendominasi, sehingga sesi ice breaking perlu dibatasi waktu.

---

## 9. Arahan Visual

**Gaya:** kartun ekspresif ala karikatur editorial koran lama, dipadukan dengan ornamen tradisional dari **berbagai daerah**, tidak hanya batik.

**Palet warna dasar:**
| Nama | Hex | Penggunaan |
|---|---|---|
| Krem Kertas | `#F4E9D3` | Latar papan |
| Coklat Jati | `#6B4226` | Garis, teks utama |
| Merah Bata | `#B5442C` | Aksen, petak spesial |
| Kunyit | `#E3A21A` | Highlight, uang |
| Hijau Pandan | `#4E8B3A` | Aksen alam |
| Biru Laut | `#1F5F8B` | Aksen laut dan transportasi |

**Elemen visual:**
- **Tengah papan:** peta Indonesia kartun dengan ikon kecil tiap provinsi dan logo Juragan Nusantara.
- **Pion (6–8 pilihan):** becak, bajaj, angkot, kapal pinisi, delman, gerobak bakso, motor ojek, ondel-ondel.
- **Bangunan:** Homestay berupa rumah kecil beratap tradisional, Resort berupa bangunan besar beratap tumpang.
- **Punggung Kartu Nasib:** siluet gunungan wayang.
- **Punggung Kartu Warga:** pos ronda dan kentongan.
- **Penanda sisi kartu:** pita kecil "🇮🇩" untuk kartu kebaikan dan "😏" untuk kartu sindiran, supaya komposisi 50:50 terasa saat dimainkan.
- **Petak spesial:** ilustrasi lucu, misalnya sel Hotel Prodeo dengan sofa empuk dan AC, Pos Pungli dengan meja kecil dan kotak "seikhlasnya", serta Warkop dengan bapak-bapak debat sambil ngopi.
- **Bingkai kartu properti:** motif sesuai grup wilayah (lihat 4.1).
- **Tipografi:** font display bernuansa tradisional untuk judul, sans-serif yang jelas untuk angka dan aturan (harus terbaca di HP dan proyektor).

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Satir dianggap menyinggung | Konten medsos diprotes, tidak nyaman dipakai di kantor | Guardrails di Bagian 2, hanya fenomena umum, uji baca ke 3–5 orang dari latar berbeda sebelum dipublikasikan |
| Permainan terlalu lama | Pemain bosan, gagal sebagai ice breaker | Mode Kilat, pajak masuk Bank (bukan Kas Warkop) |
| Satu pemain terlalu dominan | Pemain lain kehilangan minat | Kartu catch-up (W01, W28, W39), batas putaran di Mode Kilat |
| Ekonomi tidak seimbang karena 100 kartu baru | Uang terlalu banyak atau terlalu sedikit | Pantau saat playtest: rata-rata efek kartu, durasi permainan, dan jumlah pemain bangkrut. Ubah nominal di `cards.json` tanpa mengubah kode |
| Masalah merek dagang | Teguran dari pemilik merek | Nama, logo, dan visual sepenuhnya orisinal. Tidak dijual |
| Mekanik tambahan terlalu banyak | Aturan membingungkan pemain baru | Tutorial singkat di awal permainan, tooltip penjelasan di setiap petak spesial dan kartu simpan |

---

## 11. Spesifikasi Web App (Build dengan Claude Code)

### 11.1 Fase Pengembangan
| Fase | Cakupan |
|---|---|
| **MVP (fase 1)** | Pass-and-play lokal 2–6 pemain di satu perangkat, Mode Klasik dan Kilat, semua 40 petak dan 100 kartu, animasi dadu dan pion sederhana, simpan permainan otomatis di browser |
| **Fase 2** | Mode Edukasi dan bank kuis, efek suara, bot pemain (lawan komputer), tombol "Bagikan Kartu" (ekspor gambar kartu untuk konten medsos), mode layar proyektor |
| **Fase 3 (opsional)** | Multipemain online di perangkat berbeda (butuh backend realtime seperti Supabase atau Firebase) |

### 11.2 Usulan Teknologi
- **Vite + React + TypeScript**, deploy ke **Vercel**
- State permainan dengan reducer murni (`useReducer` atau Zustand) supaya aturan mudah diuji
- **Konten terpisah dari logika:** `tiles.json`, `cards.json`, `quiz.json`, `config.json`. Kartu dan angka bisa diedit tanpa menyentuh kode.
- Ilustrasi dalam format SVG (ringan dan tajam di semua layar)
- Penyimpanan permainan dengan `localStorage`
- Unit test untuk engine aturan (Vitest)

### 11.3 Struktur Folder (usulan)
```
juragan-nusantara/
├── docs/
│   └── konsep-game-juragan-nusantara.md   # dokumen ini
├── src/
│   ├── data/          # tiles.json, cards.json, quiz.json, config.json
│   ├── engine/        # aturan: dadu, gerak, sewa, kartu, penjara, bangkrut, kas
│   ├── components/    # Board, Tile, Dice, PlayerPanel, CardModal, AuctionModal
│   ├── assets/        # SVG ikon provinsi, pion, motif
│   └── App.tsx
└── README.md
```

### 11.4 Kriteria Selesai MVP
- [ ] Satu permainan penuh 4 pemain bisa diselesaikan tanpa error
- [ ] Semua 40 petak dan 100 kartu berjalan sesuai aturan
- [ ] Kas Warkop, Kas Arisan, kartu simpan, dan efek tertunda tercatat dengan benar
- [ ] Tampilan nyaman di HP (lebar 360px) dan laptop/proyektor
- [ ] Permainan bisa dilanjutkan setelah browser ditutup
- [ ] Mode Kilat selesai dalam ±45 menit untuk 4 pemain (diuji coba langsung)

### 11.5 Jenis Efek Kartu (untuk engine)

Semua 100 kartu bisa diwakili dengan jenis efek berikut:

| Kode efek | Arti | Contoh kartu |
|---|---|---|
| `RECEIVE` | Terima uang dari Bank | N01, W04 |
| `PAY` | Bayar ke Bank | N32, W30 |
| `PAY_WARKOP` | Bayar ke Kas Warkop | N31, W32 |
| `RECEIVE_FROM_ALL` | Terima dari setiap pemain lain | W03 |
| `ALL_RECEIVE` | Semua pemain menerima dari Bank | N17, W13 |
| `PAY_TO_PLAYER` | Bayar ke pemain tertentu (kiri / termiskin) | W27, W39 |
| `POOREST_RECEIVE_FROM_ALL` | Pemain termiskin menerima dari setiap pemain lain | W01 |
| `TAKE_ARISAN` | Ambil seluruh Kas Arisan | W02 |
| `CLEAR_ARISAN` | Kosongkan Kas Arisan ke Bank | W45 |
| `MOVE_TO` | Maju ke petak tertentu (gaji jika lewat MULAI) | N04, N07 |
| `MOVE_TO_NO_SALARY` | Pindah ke petak tanpa gaji | W41 |
| `MOVE_TO_NEAREST_TRANSPORT` | Maju ke transportasi terdekat, sewa ×N | N33 |
| `MOVE_STEPS` | Maju atau mundur n petak (n negatif = mundur) | N12, N35 |
| `SKIP_TURN` | Diam 1 giliran | W29, N44 |
| `SKIP_OR_PAY` | Diam 1 giliran atau bayar | N28 |
| `GO_TO_JAIL` | Masuk Hotel Prodeo | N26 |
| `KEEP_ITEM` | Simpan kartu (jail_free / orang_dalam / disaster_shield) | N27, W26, N09, W23 |
| `PAY_PER_BUILDING` | Bayar per Homestay & per Resort | N30, N36 |
| `FREE_BUILDING` | Bangun 1 Homestay gratis (fallback: terima uang) | W18 |
| `DICE_OUTCOME` | Hasil tergantung lempar dadu | W33 |
| `CONDITIONAL_WEALTH` | Efek tergantung jumlah uang pemain | W28 |
| `DEFERRED_PAY` | Terima sekarang, bayar saat syarat terpenuhi | N50 |

### 11.6 Contoh Skema `cards.json`
```json
{
  "id": "N30",
  "deck": "nasib",
  "side": "sindiran",
  "tags": ["bencana"],
  "title": "Banjir Kiriman",
  "text": "Got mampet, drainase cuma wacana.",
  "effect": {
    "type": "PAY_PER_BUILDING",
    "perHomestay": 25,
    "perResort": 100,
    "to": "bank"
  }
}
```
Satuan nominal di file data adalah **juta Rupiah**. Format tampilan (misalnya "Rp 1,5 M" atau "Rp 25 jt") diatur di lapisan UI.

### 11.7 Prompt Awal untuk Claude Code

Simpan dokumen ini di `docs/` pada folder proyek, lalu gunakan prompt berikut sebagai pembuka sesi di Claude Code:

```
Baca docs/konsep-game-juragan-nusantara.md sampai selesai. Dokumen itu adalah
spesifikasi lengkap game "Juragan Nusantara".

Bangun MVP (Bagian 11.1 fase 1) sebagai web app dengan Vite + React + TypeScript.

Urutan kerja:
1. Ubah seluruh data di dokumen menjadi file JSON di src/data/:
   tiles.json (40 petak, Bagian 3.1, 4.2–4.4), cards.json (100 kartu, Bagian 6,
   dengan skema Bagian 11.6 dan jenis efek Bagian 11.5), config.json (modal awal,
   gaji, iuran arisan, denda, aturan Pos Pungli). Jangan mengubah isi teks kartu.
2. Buat engine aturan sebagai fungsi murni di src/engine/ (tanpa React), lengkap
   dengan unit test Vitest untuk: sewa, set warna, bangun merata, gadai, kartu,
   Kas Warkop, Kas Arisan, Hotel Prodeo, Pos Pungli, kartu simpan, efek tertunda,
   dan bangkrut.
3. Buat UI: papan 11x11 responsif (mobile-first, lebar minimal 360px), panel
   pemain, dadu, modal kartu, modal lelang, dan log kejadian. Seluruh teks UI
   berbahasa Indonesia.
4. Tambahkan Mode Klasik dan Mode Kilat, serta simpan otomatis ke localStorage.
5. Pastikan kriteria Bagian 11.4 terpenuhi, lalu siapkan untuk deploy ke Vercel.

Kerjakan bertahap. Setelah setiap langkah, jalankan test dan tunjukkan hasilnya
sebelum lanjut. Tanyakan kepada saya jika ada aturan di dokumen yang ambigu,
jangan menebak.
```

---

## 12. Langkah Berikutnya

1. ~~Konfirmasi nama game~~ → **Juragan Nusantara** ✅
2. ~~Perluas isi kartu~~ → 50 kartu per dek ✅
3. ~~Lengkapi sapaan daerah~~ ✅
4. **Build MVP di Claude Code** memakai prompt Bagian 11.7.
5. **Playtest** dengan keluarga atau tim (4 orang). Catat durasi permainan, kartu yang paling memancing tawa, kartu yang terasa kurang pas, dan apakah uang terlalu cepat habis atau menumpuk.
6. Sesuaikan nominal di `cards.json` dan `config.json` berdasarkan hasil playtest.
