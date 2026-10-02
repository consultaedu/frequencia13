import { eventById } from "../events/catalog";
import { random } from "../utils/random";
import type { GameState, Log } from "./types";
export function log(
  s: GameState,
  sender: string,
  text: string,
  type: Log["type"] = "info",
) {
  s.logs.push({ time: s.minute, sender, text, type });
  if (s.logs.length > 150) s.logs.shift();
}
export function advanceUnits(s: GameState) {
  for (const u of s.units) {
    if (u.until > s.minute || !u.until) continue;
    if (u.status === "deslocando") {
      u.status = "no local";
      u.until = s.minute + 9;
      log(s, u.name, "Chegamos ao endereço. Iniciando verificação.");
    } else if (u.status === "no local") {
      const incident = s.incidents.find((i) => i.id === u.incident);
      const event = incident ? eventById(incident.eventId) : undefined;
      const [roll, seed] = random(s.rng);
      s.rng = seed;
      if (event?.risk && !s.flags.warned && roll < 0.36) {
        u.status = "sem comunicação";
        u.until = s.minute + 35;
        s.signal -= 10;
        log(
          s,
          u.name,
          "Central... encontramos alguma coisa. [SINAL PERDIDO]",
          "danger",
        );
      } else {
        if (incident) {
          incident.status = "resolved";
          s.resolved++;
        }
        log(
          s,
          u.name,
          event?.choices.find((c) => c.id === incident?.choice)?.consequences
            .message ?? "Local verificado. Retornando.",
        );
        u.status = "retornando";
        u.until = s.minute + 12;
      }
    } else if (u.status === "retornando") {
      u.status = "disponível";
      u.location = "central";
      u.until = 0;
      u.incident = undefined;
      log(s, u.name, "De volta à base. Disponível para atendimento.");
    } else if (u.status === "sem comunicação") {
      u.status = "indisponível";
      u.until = 0;
      s.danger += 12;
      const incident = s.incidents.find((i) => i.id === u.incident);
      if (incident) {
        incident.status = "ignored";
        s.ignored++;
      }
      log(
        s,
        u.name,
        "Prazo de contato excedido. Equipe não localizada.",
        "danger",
      );
    }
  }
}
