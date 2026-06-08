let ctx: AudioContext | null = null;
let muted = localStorage.getItem('gs_muted') === 'true';

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; localStorage.setItem('gs_muted', String(muted)); }

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  if (muted) return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + duration);
  } catch {}
}

export function playClick() {
  tone(800, 0.05, 'square', 0.08);
  if (!muted && navigator.vibrate) navigator.vibrate(10);
}

export function playExplosion(intensity = 1) {
  if (muted) return;
  tone(120, 0.15 * intensity, 'sawtooth', 0.12);
  tone(60, 0.25 * intensity, 'sawtooth', 0.1);
  if (navigator.vibrate) navigator.vibrate(30 * intensity);
}

export function playWin() {
  if (muted) return;
  tone(523, 0.12, 'sine', 0.12);
  setTimeout(() => tone(659, 0.12, 'sine', 0.12), 120);
  setTimeout(() => tone(784, 0.2, 'sine', 0.15), 240);
  if (navigator.vibrate) navigator.vibrate([50, 50, 50, 50, 100]);
}

export function playLose() {
  if (muted) return;
  tone(300, 0.2, 'sine', 0.1);
  setTimeout(() => tone(250, 0.3, 'sine', 0.1), 200);
  if (navigator.vibrate) navigator.vibrate(100);
}
