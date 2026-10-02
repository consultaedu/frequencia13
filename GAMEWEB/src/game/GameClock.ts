export const REAL_MS_PER_GAME_MINUTE = 1000;
export const SHIFT_END = 360;
export function clock(minute: number) {
  return `${Math.floor(minute / 60)
    .toString()
    .padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
}
