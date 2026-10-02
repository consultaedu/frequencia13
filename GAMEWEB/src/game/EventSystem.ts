import { events } from "../events/catalog";
import { random } from "../utils/random";
import type { GameEvent, GameState } from "./types";
const odds = { COMMON: 1, UNCOMMON: 0.48, RARE: 0.2, VERY_RARE: 0.06 };
export function eligible(s: GameState, e: GameEvent) {
  const r = e.requirements;
  return (
    !s.seen.includes(`${s.night}:${e.id}`) &&
    s.night >= e.night &&
    (!e.mandatory || e.id === "self-call" || e.night === s.night) &&
    s.minute >= e.timeWindow[0] &&
    s.minute <= e.timeWindow[1] &&
    (!r?.flag || s.flags[r.flag]) &&
    (!r?.power || s.power >= r.power) &&
    (!r?.availableUnit || s.units.some((u) => u.status === "disponível")) &&
    (!r?.event || s.seen.some((id) => id.endsWith(`:${r.event}`)))
  );
}
export function selectEvent(s: GameState): GameEvent | undefined {
  const fixed = events.find(
    (e) =>
      e.mandatory &&
      eligible(s, e) &&
      (e.id !== "self-call" || s.minute >= 210 + (s.seed % 35)),
  );
  if (fixed) return fixed;
  if (
    s.minute % (s.night === 1 ? 34 : 27) !== 0 ||
    s.incidents.filter((i) => i.status === "pending").length >= 3
  )
    return;
  const options = events.filter((e) => !e.mandatory && eligible(s, e));
  const [roll, seed] = random(s.rng);
  s.rng = seed;
  const total = options.reduce((n, e) => n + odds[e.rarity], 0);
  let cursor = roll * total;
  return options.find((e) => (cursor -= odds[e.rarity]) < 0);
}
