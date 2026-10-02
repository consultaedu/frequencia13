import type { Settings } from "./types";
type Sound = "phone" | "beep" | "radio" | "noise" | "alert" | "key";
let context: AudioContext | undefined;
export function unlockAudio() {
  try {
    context ??= new AudioContext();
    void context.resume().catch(() => {});
  } catch {
    /* The game remains playable without Web Audio. */
  }
}
export function sound(type: Sound, settings: Settings) {
  if (!context || context.state !== "running" || settings.master === 0) return;
  const volume = settings.master * settings.effects * 0.12;
  const count = type === "phone" ? 3 : 1;
  for (let i = 0; i < count; i++) {
    const start = context.currentTime + i * 0.23;
    const duration =
      type === "noise" || type === "radio"
        ? 0.2
        : type === "key"
          ? 0.025
          : 0.14;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    gain.connect(context.destination);
    if (type === "noise" || type === "radio") {
      const buffer = context.createBuffer(
        1,
        Math.floor(context.sampleRate * duration),
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let j = 0; j < data.length; j++)
        data[j] = (Math.random() * 2 - 1) * 0.4;
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      source.start(start);
      source.stop(start + duration);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
    } else {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(
        type === "phone"
          ? 740
          : type === "alert"
            ? 220
            : type === "key"
              ? 1300
              : 620,
        start,
      );
      oscillator.connect(gain);
      oscillator.start(start);
      oscillator.stop(start + duration);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
    }
  }
}
