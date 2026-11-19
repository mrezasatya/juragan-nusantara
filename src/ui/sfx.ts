// Efek suara disintesis dengan Web Audio API (tanpa file audio, tetap jalan offline).
// AudioContext baru dibuat setelah ada interaksi pengguna (aturan autoplay browser).

const MUTE_KEY = 'juragan-nusantara:mute';
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

function ac(): AudioContext | null {
  if (muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Panggil pada interaksi pertama agar audio diizinkan browser. */
export function unlockAudio() {
  ac();
}

export const isMuted = () => muted;
export function setMuted(v: boolean) {
  muted = v;
  try {
    localStorage.setItem(MUTE_KEY, v ? '1' : '0');
  } catch {
    /* abaikan */
  }
  if (v && ctx) void ctx.suspend();
  if (!v && ctx) void ctx.resume();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.5, slideTo?: number) {
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.3, filter = 2000) {
  const c = ac();
  if (!c || !master) return;
  const t0 = c.currentTime + start;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filter;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t0);
}

export const sfx = {
  /** Dadu dikocok & dilempar: rentetan "klik" acak. */
  dice() {
    for (let i = 0; i < 9; i++) noise(i * 0.09 + Math.random() * 0.03, 0.05, 0.5, 2500 + Math.random() * 2500);
    noise(1.05, 0.08, 0.6, 1800);
    noise(1.2, 0.06, 0.4, 1600);
  },
  step(k = 0) {
    tone(k % 2 ? 330 : 294, 0, 0.07, 'triangle', 0.25);
  },
  coin() {
    tone(988, 0, 0.09, 'square', 0.18);
    tone(1319, 0.08, 0.28, 'square', 0.18);
  },
  pay() {
    tone(440, 0, 0.12, 'triangle', 0.3, 330);
    tone(330, 0.1, 0.2, 'triangle', 0.25, 247);
  },
  buy() {
    // "ka-ching" mesin kasir
    noise(0, 0.05, 0.4, 4000);
    tone(1568, 0.05, 0.15, 'square', 0.15);
    tone(2093, 0.12, 0.35, 'square', 0.15);
  },
  build() {
    noise(0, 0.08, 0.5, 600);
    tone(523, 0.06, 0.1, 'triangle', 0.3);
    tone(659, 0.14, 0.1, 'triangle', 0.3);
    tone(784, 0.22, 0.2, 'triangle', 0.3);
  },
  card() {
    noise(0, 0.18, 0.35, 5000);
    tone(880, 0.12, 0.12, 'sine', 0.2);
  },
  jail() {
    // nada turun "wah-wah-wah"
    [392, 370, 349].forEach((f, i) => tone(f, i * 0.28, 0.26, 'sawtooth', 0.18, f * 0.97));
    tone(330, 0.84, 0.7, 'sawtooth', 0.18, 280);
  },
  bankrupt() {
    tone(220, 0, 0.9, 'sawtooth', 0.22, 70);
    noise(0.1, 0.5, 0.3, 300);
  },
  win() {
    const notes = [523, 659, 784, 1047, 784, 1047];
    notes.forEach((f, i) => tone(f, i * 0.13, i === notes.length - 1 ? 0.7 : 0.14, 'square', 0.16));
  },
  turn() {
    tone(784, 0, 0.08, 'sine', 0.2);
    tone(1047, 0.07, 0.14, 'sine', 0.2);
  },
};
