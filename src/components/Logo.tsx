export default function Logo({ big = false }: { big?: boolean }) {
  return (
    <div className={`logo ${big ? 'logo-big' : ''}`}>
      <div className="logo-title">
        <span>Juragan</span>
        <span>Nusantara</span>
      </div>
      <div className="logo-tag">Borong Nusantara, asal kuat bayar iuran.</div>
    </div>
  );
}
