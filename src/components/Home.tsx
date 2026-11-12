import Logo from './Logo.tsx';

interface Props {
  hasSave: boolean;
  onContinue: () => void;
  onNew: () => void;
  onRules: () => void;
  onTutorial: () => void;
  onGallery: () => void;
}

export default function Home({ hasSave, onContinue, onNew, onRules, onTutorial, onGallery }: Props) {
  return (
    <main className="home">
      <div className="home-card">
        <Logo big />
        <p className="home-quote">"Dari Sabang sampai Merauke, semua bisa diborong... asal kuat bayar pajak, pungli, dan iuran RT."</p>
        <div className="home-actions">
          {hasSave && (
            <button className="btn btn-primary btn-lg" onClick={onContinue}>
              ▶ Lanjutkan Permainan
            </button>
          )}
          <button className={`btn btn-lg ${hasSave ? '' : 'btn-primary'}`} onClick={onNew}>
            🎲 Permainan Baru
          </button>
          <div className="home-row">
            <button className="btn" onClick={onRules}>
              📖 Cara Main
            </button>
            <button className="btn" onClick={onTutorial}>
              💡 Tutorial Singkat
            </button>
          </div>
          <button className="btn" onClick={onGallery}>
            🏠 Galeri Rumah Adat &amp; Pion 3D
          </button>
        </div>
        <p className="home-foot">
          2–6 pemain · satu perangkat, main bergantian · untuk remaja &amp; dewasa
          <br />
          Harga di dalam game adalah mekanik permainan, bukan penilaian terhadap daerah atau warganya.
        </p>
      </div>
    </main>
  );
}
