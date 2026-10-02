import { eventById } from "../events/catalog";
import type { GameState } from "./types";
export function cameraState(s: GameState, camera: number) {
  if (!s.systems.cameras || s.power <= 0) return "SEM SINAL";
  if (s.signal < 25) return "INTERFERÊNCIA";
  if (
    (camera === 2 && s.night >= 2 && s.cameraVisits[2] > 1) ||
    s.incidents.some(
      (i) => eventById(i.eventId).camera === camera && i.status === "pending",
    )
  )
    return "MOVIMENTO DETECTADO";
  if (s.night >= 3 && (s.minute + camera * 7) % 83 < 5) return "INTERFERÊNCIA";
  return "NORMAL";
}
