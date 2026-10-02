import type { Action, GameState, Consequence } from "./types";
import { eventById } from "../events/catalog";
import { selectEvent } from "./EventSystem";
import { advanceUnits, log } from "./DispatchSystem";
import { SHIFT_END } from "./GameClock";
export function createGame(seed: number): GameState {
  const s: GameState = {
    version: 1,
    seed,
    rng: seed,
    night: 1,
    minute: 0,
    phase: "playing",
    paused: false,
    power: 100,
    signal: 100,
    danger: 8,
    units: [1, 2, 3].map((id) => ({
      id,
      name: `UNIDADE 0${id}`,
      status: "disponível",
      location: "central",
      until: 0,
    })),
    incidents: [],
    seen: [],
    flags: {},
    documents: ["manual"],
    decisions: [],
    logs: [
      {
        time: 0,
        sender: "SISTEMA",
        text: "Turno autorizado. Boa noite, operador. Santa Aurora está sob sua supervisão.",
        type: "info",
      },
    ],
    systems: { cameras: true, radio: true, lights: true, auxiliary: true },
    hiddenUntil: 0,
    resolved: 0,
    ignored: 0,
    cameraVisits: Array<number>(8).fill(0),
    camera: 0,
    charges: 2,
  };
  s.checkpoint = JSON.stringify(s);
  return s;
}
const clamp = (n: number) => Math.max(0, Math.min(100, n));
function consequence(s: GameState, c: Consequence, report = true) {
  s.power = clamp(s.power + (c.power ?? 0));
  s.signal = clamp(s.signal + (c.signal ?? 0));
  s.danger = clamp(s.danger + (c.danger ?? 0));
  if (c.flag) s.flags[c.flag] = true;
  if (c.document && !s.documents.includes(c.document)) {
    s.documents.push(c.document);
    log(s, "ARQUIVO", "Novo documento recuperado. Consulte ARQUIVOS.");
  }
  if (report) log(s, "REGISTRO", c.message);
}
function checkFailure(s: GameState) {
  s.power = clamp(s.power);
  s.signal = clamp(s.signal);
  s.danger = clamp(s.danger);
  if (s.power <= 0) s.failure = "FALHA CRÍTICA DE ENERGIA";
  else if (s.danger >= 100)
    s.failure = s.flags.sealed
      ? "OPERADOR NÃO LOCALIZADO"
      : "CENTRAL COMPROMETIDA";
  else if (s.signal <= 0) s.failure = "SINAL PERDIDO";
  else if (s.units.every((u) => u.status === "indisponível"))
    s.failure = "PROTOCOLO VIOLADO";
  if (s.failure) s.phase = "lost";
}
export function gameReducer(state: GameState, action: Action): GameState {
  if (action.type === "PAUSE")
    return state.phase === "playing"
      ? { ...state, paused: !state.paused }
      : state;
  if (action.type === "NEXT") {
    if (state.phase !== "won" || state.night >= 7) return state;
    const s = createGame(state.seed);
    s.night = state.night + 1;
    s.rng = state.rng;
    s.documents = [...state.documents];
    s.flags = { ...state.flags };
    s.seen = [...state.seen];
    s.decisions = [...state.decisions];
    s.danger = Math.min(25, state.danger * 0.2 + s.night * 2);
    s.logs = [
      {
        time: 0,
        sender: "SISTEMA",
        text: `Noite ${s.night}. Recursos reabastecidos. Os registros da noite anterior foram preservados.`,
        type: "info",
      },
    ];
    delete s.checkpoint;
    s.checkpoint = JSON.stringify(s);
    return s;
  }
  if (state.phase !== "playing" || (state.paused && action.type !== "CAMERA"))
    return state;
  const s = structuredClone(state);
  if (action.type === "TICK") {
    s.minute++;
    s.power = clamp(
      s.power -
        (0.035 +
          s.night * 0.009 +
          (s.systems.cameras ? 0.045 : 0) +
          (s.systems.radio ? 0.022 : 0) +
          (s.systems.lights ? 0.032 : 0) +
          (s.systems.auxiliary ? 0.027 : 0)),
    );
    s.signal = clamp(
      s.signal - (s.systems.radio ? 0.025 + s.night * 0.008 : 0.15),
    );
    if (!s.systems.lights && s.minute % 20 === 0) s.danger += 2;
    advanceUnits(s);
    for (const i of s.incidents)
      if (i.status === "pending" && i.expires <= s.minute) {
        i.status = "ignored";
        s.ignored++;
        s.danger += 10;
        s.signal -= 2;
        log(
          s,
          "TELEFONIA",
          `${eventById(i.eventId).title}: prazo de atendimento expirado.`,
          "warning",
        );
      }
    const event = selectEvent(s);
    if (event) {
      s.seen.push(`${s.night}:${event.id}`);
      s.incidents.push({
        id: `${s.night}:${event.id}`,
        eventId: event.id,
        time: s.minute,
        expires: s.minute + 50,
        status: "pending",
      });
      log(s, "TELEFONIA", `Chamada recebida: ${event.title}.`, "warning");
      if (event.id === "self-call") {
        s.hiddenUntil = s.minute + 16;
        s.signal = clamp(s.signal - 15);
        log(s, "SEM REMETENTE", "Não mande mais ninguém.", "danger");
      }
    }
    if (s.night >= 3 && s.minute === 170) {
      s.power -= 9;
      s.systems.cameras = false;
      log(
        s,
        "SISTEMA",
        "Queda de tensão. Setor de câmeras desativado; religue em SISTEMA.",
        "danger",
      );
    }
    checkFailure(s);
    if (s.phase === "playing" && s.minute >= SHIFT_END) {
      s.phase = s.night === 7 ? "complete" : "won";
      for (const i of s.incidents)
        if (i.status === "pending") {
          i.status = "ignored";
          s.ignored++;
        }
      log(
        s,
        "SISTEMA",
        "06:00. Turno encerrado. Registros transferidos ao plantão diurno.",
      );
    }
  } else if (action.type === "CHOOSE") {
    const i = s.incidents.find(
      (x) => x.id === action.incident && x.status === "pending",
    );
    if (!i) return state;
    const e = eventById(i.eventId);
    const c = e.choices.find((x) => x.id === action.choice);
    if (!c) return state;
    if (c.dispatch) {
      const unit = s.units.find(
        (u) => u.id === action.unit && u.status === "disponível",
      );
      if (!unit || !s.systems.radio || s.power < 2 || s.signal < 10)
        return state;
      unit.status = "deslocando";
      unit.location = e.location;
      unit.until = s.minute + 8 + ((s.seed + unit.id * 3 + s.minute) % 10);
      unit.incident = i.id;
      i.status = "dispatched";
      log(s, unit.name, `Deslocando para ${e.title.toLowerCase()}.`);
    } else {
      i.status = c.id === "ignore" ? "ignored" : "resolved";
      if (i.status === "ignored") s.ignored++;
      else s.resolved++;
    }
    i.choice = c.id;
    consequence(s, c.consequences, !c.dispatch);
    s.decisions.push(`N${s.night} · ${e.title}: ${c.label}`);
    if (e.id === "self-call" && c.id === "obey") {
      s.hiddenUntil = 0;
      for (const u of s.units)
        if (u.status !== "disponível" && u.status !== "indisponível") {
          const active = s.incidents.find((x) => x.id === u.incident);
          if (active?.status === "dispatched") {
            active.status = "resolved";
            s.resolved++;
          }
          u.status = "retornando";
          u.until = s.minute + 12;
        }
    }
    if (e.followUp) log(s, "SISTEMA", e.followUp);
    if (e.id === "story-7" && c.id === "accept") {
      s.failure = "OPERADOR NÃO LOCALIZADO";
      s.phase = "lost";
    }
    checkFailure(s);
  } else if (action.type === "TOGGLE") {
    s.systems[action.system] = !s.systems[action.system];
    log(
      s,
      "SISTEMA",
      `${action.system === "cameras" ? "Câmeras" : action.system === "lights" ? "Iluminação" : action.system === "radio" ? "Rádio" : "Auxiliares"}: ${s.systems[action.system] ? "ativado" : "desativado"}.`,
    );
  } else if (action.type === "REPAIR") {
    if (action.system === "power" && s.charges > 0 && s.power < 95) {
      s.power = clamp(s.power + 28);
      s.charges--;
      log(s, "GERADOR", "Carga auxiliar aplicada. +28% de energia.");
    }
    if (action.system === "signal" && s.power >= 7 && s.signal < 95) {
      s.power -= 7;
      s.signal = clamp(s.signal + 35);
      log(s, "RÁDIO", "Enlace reiniciado. +35% de sinal.");
    }
    if (
      action.system === "units" &&
      s.power >= 10 &&
      s.systems.radio &&
      s.units.some((u) => u.status === "sem comunicação")
    ) {
      s.power -= 10;
      for (const u of s.units)
        if (u.status === "sem comunicação") {
          u.status = "retornando";
          u.until = s.minute + 12;
          const i = s.incidents.find((x) => x.id === u.incident);
          if (i) {
            i.status = "resolved";
            s.resolved++;
          }
        }
      log(
        s,
        "RÁDIO",
        "Canal de emergência aberto. Equipes orientadas a retornar.",
      );
    }
  } else if (action.type === "CAMERA") {
    if (action.camera < 0 || action.camera > 7) return state;
    s.camera = action.camera;
    s.cameraVisits[action.camera]++;
  } else if (action.type === "COMMAND") {
    const cmd = action.command.toLowerCase().trim();
    if (cmd === "archive 13" && s.documents.includes("employee"))
      consequence(s, {
        flag: "archive",
        document: "incident",
        message:
          "Arquivo 13 recuperado. O registro estava aberto em outra sessão.",
      });
    if (
      cmd === "signal" &&
      (s.documents.includes("incident") || s.documents.includes("protocol")) &&
      !s.flags.signal
    )
      consequence(s, {
        flag: "signal",
        signal: 15,
        danger: -10,
        message: "Portadora 13 isolada. Uma voz deixou de responder.",
      });
    if (
      cmd === "operator" &&
      (s.documents.includes("operator") || s.documents.includes("protocol"))
    )
      consequence(s, {
        flag: "operator",
        document: "operator",
        message: "Identificação confirmada. Você não autorizou substituição.",
      });
  }
  return s;
}
