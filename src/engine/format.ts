/** Format nominal (satuan juta Rupiah) untuk tampilan: "Rp 25 jt", "Rp 1,5 M". */
export function rp(juta: number): string {
  const neg = juta < 0;
  const v = Math.abs(juta);
  let s: string;
  if (v >= 1000) {
    const m = Math.round((v / 1000) * 100) / 100;
    s = `Rp ${m.toLocaleString('id-ID', { maximumFractionDigits: 2 })} M`;
  } else {
    s = `Rp ${v.toLocaleString('id-ID')} jt`;
  }
  return neg ? `−${s}` : s;
}
