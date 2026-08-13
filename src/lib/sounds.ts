let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(
  frequency: number,
  duration: number,
  volume = 0.07,
  type: OscillatorType = "sine"
) {
  const ctx = getCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playKnockSound() {
  tone(880, 0.25, 0.09);
  setTimeout(() => tone(660, 0.2, 0.07), 120);
}

export function playJoinSound() {
  tone(523, 0.12, 0.06);
  setTimeout(() => tone(784, 0.18, 0.07), 90);
}

export function playLeaveSound() {
  tone(440, 0.2, 0.05);
}

export function playChatSound() {
  tone(1200, 0.08, 0.04, "triangle");
}

export function playAdmitSound() {
  tone(392, 0.1, 0.05);
  setTimeout(() => tone(523, 0.15, 0.06), 80);
}
