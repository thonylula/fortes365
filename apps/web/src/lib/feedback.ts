export function hapticSuccess() {
  try {
    navigator.vibrate?.([50, 30, 80]);
  } catch { /* not available */ }
}

export function hapticLight() {
  try {
    navigator.vibrate?.(30);
  } catch { /* not available */ }
}

export function playSuccess() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.15;
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.15);
    });
  } catch { /* not available */ }
}

export function playComplete() {
  try {
    const ctx = new AudioContext();
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.2);
    });
  } catch { /* not available */ }
}
