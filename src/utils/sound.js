/**
 * Play notification sound.
 * Tries /sounds/notify.mp3 first; falls back to Web Audio API beep if file missing or blocked.
 */
export function playNotificationSound() {
  try {
    const a = new Audio("/sounds/notify.mp3");
    a.volume = 0.8;
    a.play().catch(() => {
      playBeepFallback();
    });
  } catch {
    playBeepFallback();
  }
}

function playBeepFallback() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}
