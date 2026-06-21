// Web Audio API sound effects
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainValue = 0.3,
  delay = 0
) {
  try {
    const ctx = getAudioCtx();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + delay);
    gainNode.gain.linearRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    oscillator.start(ctx.currentTime + delay);
    oscillator.stop(ctx.currentTime + delay + duration);
  } catch (e) {
    // silently fail
  }
}

// Click / UI confirm sound
export function playClick() {
  playTone(800, 0.08, 'sine', 0.15);
}

// Success / add bet sound
export function playAdd() {
  playTone(440, 0.12, 'sine', 0.2);
  playTone(550, 0.12, 'sine', 0.2, 0.1);
  playTone(660, 0.15, 'sine', 0.2, 0.2);
}

// Win / victory fanfare
export function playWin() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    playTone(freq, 0.25, 'sine', 0.25, i * 0.12);
  });
  // sparkle layer
  setTimeout(() => {
    playTone(2000, 0.1, 'sine', 0.1);
    playTone(2500, 0.08, 'sine', 0.08, 0.05);
  }, 500);
}

// Delete / remove sound
export function playDelete() {
  playTone(300, 0.15, 'sawtooth', 0.15);
  playTone(200, 0.2, 'sawtooth', 0.1, 0.1);
}

// Open modal sound
export function playOpen() {
  playTone(600, 0.1, 'sine', 0.12);
  playTone(900, 0.12, 'sine', 0.12, 0.08);
}

// Hover sound
export function playHover() {
  playTone(1200, 0.04, 'sine', 0.06);
}

// Switch tab sound
export function playTab() {
  playTone(700, 0.07, 'sine', 0.12);
  playTone(1000, 0.07, 'sine', 0.1, 0.06);
}
