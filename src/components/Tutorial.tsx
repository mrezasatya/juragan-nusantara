import { useState } from 'react';
import Modal from './Modal.tsx';
import { Die, Homestay, Resort } from './Art.tsx';

const SLIDES = [
  {
    title: 'Selamat datang, calon Juragan!',
    body: (
      <>
        <p>
          Keliling Indonesia dari <strong>Sabang sampai Merauke</strong>, borong properti di 22 provinsi, dan tagih sewa dari pemain lain.
        </p>
        <p>
          <strong>Tujuan:</strong> jadi pemain terakhir yang belum bangkrut (Mode Klasik), atau punya total aset terbesar saat waktu habis (Mode Kilat).
        </p>
      </>
    ),
  },
  {
    title: '1. Lempar dadu',
    body: (
      <>
        <div className="tut-dice">
          <Die value={3} /> <Die value={4} />
        </div>
        <p>
          Tekan <strong>🎲 Lempar Dadu</strong>. Pion maju sesuai jumlah kedua dadu. Lewat <strong>MULAI</strong> = gajian Rp 200 jt (Rp 10 jt otomatis
          masuk Kas Arisan).
        </p>
        <p>
          <strong>Dobel?</strong> Lempar lagi. Dobel 3 kali berturut-turut = masuk Hotel Prodeo ("Ngebut terus, dicurigai").
        </p>
        <p className="small muted">Main pakai dadu sungguhan? Pilih "Dadu fisik" saat membuat permainan, lalu masukkan angkanya.</p>
      </>
    ),
  },
  {
    title: '2. Beli & tagih sewa',
    body: (
      <>
        <p>Berhenti di properti tak bertuan? <strong>Beli</strong> atau tolak. Kalau ditolak, properti <strong>dilelang</strong> ke semua pemain mulai Rp 10 jt.</p>
        <p>
          Pemain lain yang berhenti di propertimu wajib <strong>bayar sewa</strong>. Punya satu grup warna lengkap? Sewa dasar jadi <strong>2×</strong>.
        </p>
      </>
    ),
  },
  {
    title: '3. Bangun Homestay & Resort',
    body: (
      <>
        <div className="tut-dice">
          <Homestay size={36} /> <Homestay size={36} /> → <Resort size={44} />
        </div>
        <p>
          Kuasai satu grup warna, lalu bangun lewat <strong>🏗️ Kelola Aset</strong>. Bangun harus merata. 4 Homestay bisa naik jadi 1 Resort. Sewa
          melonjak drastis!
        </p>
        <p>Butuh uang? Gadaikan properti (dapat 50% harga) atau jual bangunan (setengah harga).</p>
      </>
    ),
  },
  {
    title: '4. Petak khas Indonesia',
    body: (
      <ul className="tut-list">
        <li>☕ <strong>Warkop</strong>: ambil seluruh Kas Warkop (isinya denda & pungli).</li>
        <li>🪙 <strong>Pos Pungli</strong>: bayar "uang rokok" atau nego pakai dadu.</li>
        <li>🚨 <strong>KENA OTT!</strong>: langsung masuk Hotel Prodeo. Keluar dengan denda, dadu dobel, atau kartu.</li>
        <li>🎴 <strong>Kartu Nasib & Kartu Warga</strong>: 50% kebaikan Indonesia 🇮🇩, 50% sindiran 😏.</li>
      </ul>
    ),
  },
  {
    title: '5. Main bareng',
    body: (
      <>
        <p>
          Satu perangkat dipakai bergantian. Pemain yang sedang giliran ditandai di bagian atas layar. Ketuk petak mana saja untuk melihat detailnya.
        </p>
        <p>
          Bisa <strong>🤝 jual-beli</strong> properti &amp; kartu, atau <strong>💸 pinjam uang</strong> ke tetangga (bunga maks. 10%, lunasi dalam 3
          putaran!).
        </p>
        <p>Permainan tersimpan otomatis. Tutup browser kapan saja, lanjutkan nanti.</p>
      </>
    ),
  },
];

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const s = SLIDES[i];
  const last = i === SLIDES.length - 1;
  return (
    <Modal title={s.title} onClose={onClose} className="modal-tutorial">
      <div className="tut-body">{s.body}</div>
      <div className="tut-dots" aria-hidden>
        {SLIDES.map((_, k) => (
          <span key={k} className={k === i ? 'on' : ''} />
        ))}
      </div>
      <div className="prompt-actions row">
        {i > 0 ? (
          <button className="btn" onClick={() => setI(i - 1)}>
            ← Sebelumnya
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={onClose}>
            Lewati
          </button>
        )}
        <button className="btn btn-primary" onClick={() => (last ? onClose() : setI(i + 1))}>
          {last ? 'Ayo main!' : 'Lanjut →'}
        </button>
      </div>
    </Modal>
  );
}
