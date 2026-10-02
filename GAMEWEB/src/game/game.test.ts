import { describe, expect, it, vi, beforeEach } from "vitest";
import { createGame, gameReducer } from "./GameState";
import { clock } from "./GameClock";
import { selectEvent } from "./EventSystem";
import { random } from "../utils/random";
import {
  deserialize,
  serialize,
  saveGame,
  loadGame,
  deleteSave,
  loadSettings,
  saveSettings,
  defaultSettings,
} from "./SaveSystem";
import { cameraState } from "./CameraSystem";
import { events, eventById } from "../events/catalog";
import { ending } from "./StoryFlags";
import type { GameState } from "./types";
function ticks(s: GameState, n: number) {
  for (let i = 0; i < n; i++) s = gameReducer(s, { type: "TICK" });
  return s;
}
function survive(s: GameState) {
  for (let i = 0; i < 360 && s.phase === "playing"; i++) {
    s = gameReducer(s, { type: "TICK" });
    for (const incident of s.incidents.filter((x) => x.status === "pending")) {
      const e = eventById(incident.eventId);
      const choice =
        e.choices.find((c) => c.id === "obey") ??
        e.choices.find(
          (c) =>
            !c.dispatch &&
            c.id !== "ignore" &&
            (c.consequences.danger ?? 0) <= 0,
        ) ??
        e.choices[0];
      s = gameReducer(s, {
        type: "CHOOSE",
        incident: incident.id,
        choice: choice.id,
        unit: s.units.find((u) => u.status === "disponível")?.id,
      });
    }
    if (s.power < 35) s = gameReducer(s, { type: "REPAIR", system: "power" });
    if (s.signal < 50) s = gameReducer(s, { type: "REPAIR", system: "signal" });
    if (s.units.some((u) => u.status === "sem comunicação"))
      s = gameReducer(s, { type: "REPAIR", system: "units" });
  }
  return s;
}
describe("relógio e estado", () => {
  it("avança um minuto, formata e respeita pausa", () => {
    const s = createGame(13);
    expect(clock(227)).toBe("03:47");
    expect(ticks(s, 3).minute).toBe(3);
    expect(ticks({ ...s, paused: true }, 20).minute).toBe(0);
  });
  it("não altera o estado original nem permite decisões durante pausa", () => {
    const s = ticks(createGame(13), 3);
    const copy = serialize(s);
    gameReducer(s, {
      type: "CHOOSE",
      incident: s.incidents[0].id,
      choice: "ignore",
    });
    expect(serialize(s)).toBe(copy);
    const paused = { ...s, paused: true };
    expect(
      gameReducer(paused, {
        type: "CHOOSE",
        incident: s.incidents[0].id,
        choice: "ignore",
      }),
    ).toBe(paused);
  });
  it("vence exatamente às 06:00 e encerra o relógio", () => {
    const s = ticks({ ...createGame(42), minute: 359 }, 1);
    expect(s.phase).toBe("won");
    expect(s.minute).toBe(360);
    expect(ticks(s, 9).minute).toBe(360);
  });
  it("derrotas por energia, risco, sinal e equipes", () => {
    expect(ticks({ ...createGame(1), power: 0.01 }, 1).failure).toBe(
      "FALHA CRÍTICA DE ENERGIA",
    );
    expect(ticks({ ...createGame(1), danger: 100 }, 1).failure).toBe(
      "CENTRAL COMPROMETIDA",
    );
    expect(ticks({ ...createGame(1), signal: 0.01 }, 1).failure).toBe(
      "SINAL PERDIDO",
    );
    const s = createGame(1);
    s.units.forEach((u) => (u.status = "indisponível"));
    expect(ticks(s, 1).failure).toBe("PROTOCOLO VIOLADO");
  });
});
describe("eventos e RNG", () => {
  it("seed reproduz a sequência, seeds distintas variam", () => {
    expect(random(13)).toEqual(random(13));
    expect(random(13)).not.toEqual(random(14));
    expect(serialize(ticks(createGame(13), 120))).toBe(
      serialize(ticks(createGame(13), 120)),
    );
  });
  it("catálogo contém no mínimo 10/5/3/1 e IDs únicos", () => {
    for (const [rarity, min] of [
      ["COMMON", 10],
      ["UNCOMMON", 5],
      ["RARE", 3],
      ["VERY_RARE", 1],
    ] as const)
      expect(
        events.filter((e) => e.rarity === rarity).length,
      ).toBeGreaterThanOrEqual(min);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });
  it("primeira ligação é garantida e não repete", () => {
    const s = ticks(createGame(123), 3);
    expect(s.incidents[0].eventId).toBe("first");
    expect(selectEvent(s)).toBeUndefined();
    expect(s.seen).toContain("1:first");
  });
  it("consequências diferentes e decisão aplicada uma única vez", () => {
    const s = ticks(createGame(13), 3);
    const a = gameReducer(s, {
      type: "CHOOSE",
      incident: s.incidents[0].id,
      choice: "advise",
    });
    const b = gameReducer(s, {
      type: "CHOOSE",
      incident: s.incidents[0].id,
      choice: "ignore",
    });
    expect(a.danger).toBeLessThan(b.danger);
    expect(b.ignored).toBe(1);
    expect(
      gameReducer(b, {
        type: "CHOOSE",
        incident: s.incidents[0].id,
        choice: "ignore",
      }),
    ).toBe(b);
  });
  it("chamada não atendida expira com consequência", () => {
    const s = ticks(createGame(13), 53);
    expect(s.incidents[0].status).toBe("ignored");
    expect(s.ignored).toBeGreaterThan(0);
  });
  it("evento da central oculta equipes e obedecer restaura rastreamento", () => {
    let s = createGame(13);
    s.night = 2;
    s.minute = 222;
    s = ticks(s, 1);
    expect(s.incidents[0].eventId).toBe("self-call");
    expect(s.hiddenUntil).toBeGreaterThan(s.minute);
    s = gameReducer(s, {
      type: "CHOOSE",
      incident: s.incidents[0].id,
      choice: "obey",
    });
    expect(s.flags.warned).toBe(true);
    expect(s.hiddenUntil).toBe(0);
    expect(s.documents).toContain("protocol");
  });
});
describe("despacho e energia", () => {
  it("equipe viaja, atende, retorna e fica disponível", () => {
    let s = ticks(createGame(13), 3);
    s = gameReducer(s, {
      type: "CHOOSE",
      incident: s.incidents[0].id,
      choice: "dispatch",
      unit: 1,
    });
    expect(s.units[0].status).toBe("deslocando");
    s = ticks(s, s.units[0].until - s.minute);
    expect(s.units[0].status).toBe("no local");
    s = ticks(s, 9);
    expect(s.units[0].status).toBe("retornando");
    expect(s.incidents[0].status).toBe("resolved");
    s = ticks(s, 12);
    expect(s.units[0].status).toBe("disponível");
  });
  it("rádio desligado impede despacho e desligar câmera economiza energia", () => {
    let s = ticks(createGame(13), 3);
    s = gameReducer(s, { type: "TOGGLE", system: "radio" });
    expect(
      gameReducer(s, {
        type: "CHOOSE",
        incident: s.incidents[0].id,
        choice: "dispatch",
        unit: 1,
      }),
    ).toBe(s);
    const off = gameReducer(s, { type: "TOGGLE", system: "cameras" });
    expect(ticks(off, 10).power).toBeGreaterThan(ticks(s, 10).power);
    expect(cameraState(off, 0)).toBe("SEM SINAL");
  });
  it("gerador tem apenas duas cargas e sinal custa energia", () => {
    let s = { ...createGame(13), power: 20, signal: 30 };
    for (let n = 0; n < 3; n++)
      s = gameReducer(s, { type: "REPAIR", system: "power" });
    expect(s.power).toBe(76);
    expect(s.charges).toBe(0);
    s = gameReducer(s, { type: "REPAIR", system: "signal" });
    expect(s.power).toBe(69);
    expect(s.signal).toBe(65);
  });
  it("recupera equipe sem comunicação e resolve seu atendimento", () => {
    let s = ticks(createGame(13), 3);
    s.incidents[0].status = "dispatched";
    s.units[0].status = "sem comunicação";
    s.units[0].incident = s.incidents[0].id;
    s.units[0].until = 20;
    s = gameReducer(s, { type: "REPAIR", system: "units" });
    expect(s.units[0].status).toBe("retornando");
    expect(s.incidents[0].status).toBe("resolved");
  });
  it("câmera muda na segunda visita a partir da noite 2", () => {
    let s = { ...createGame(13), night: 2 };
    s = gameReducer(s, { type: "CAMERA", camera: 2 });
    expect(cameraState(s, 2)).toBe("NORMAL");
    s = gameReducer(s, { type: "CAMERA", camera: 1 });
    s = gameReducer(s, { type: "CAMERA", camera: 2 });
    expect(cameraState(s, 2)).toBe("MOVIMENTO DETECTADO");
  });
});
describe("campanha", () => {
  it.each([1, 13, 1998, 4294967295])(
    "as sete noites são vencíveis com seed %s",
    (seed) => {
      let s = createGame(seed);
      for (let night = 1; night <= 7; night++) {
        s = survive(s);
        expect(s.night).toBe(night);
        expect(s.phase).toBe(night === 7 ? "complete" : "won");
        expect(s.incidents.some((i) => i.eventId === `story-${night}`)).toBe(
          true,
        );
        if (night < 7) s = gameReducer(s, { type: "NEXT" });
      }
    },
  );
  it("próxima noite preserva narrativa, renova recursos e checkpoint", () => {
    let s = createGame(13);
    s.phase = "won";
    s.documents.push("employee");
    s.flags.echo = true;
    s = gameReducer(s, { type: "NEXT" });
    expect(s.night).toBe(2);
    expect(s.power).toBe(100);
    expect(s.documents).toContain("employee");
    expect(s.flags.echo).toBe(true);
    expect(deserialize(s.checkpoint ?? "")?.night).toBe(2);
  });
  it("comandos exigem pistas; investigação altera o final", () => {
    let s = createGame(13);
    s = gameReducer(s, { type: "COMMAND", command: "signal" });
    expect(s.flags.signal).toBeUndefined();
    s.documents.push("protocol");
    s = gameReducer(s, { type: "COMMAND", command: "signal" });
    s = gameReducer(s, { type: "COMMAND", command: "operator" });
    s = gameReducer(s, { type: "TOGGLE", system: "auxiliary" });
    expect(ending(s).title).toBe("A cidade amanheceu");
    expect(ending(createGame(13)).title).toBe("O posto permanece ocupado");
  });
});
describe("save/load e configurações", () => {
  beforeEach(() => {
    const memory = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => memory.set(key, value),
      removeItem: (key: string) => memory.delete(key),
    });
  });
  it("serializa, salva, carrega e apaga sem perder seed ou flags", () => {
    const s = survive(createGame(13));
    expect(deserialize(serialize(s))).toEqual(s);
    expect(saveGame(s)).toBe(true);
    expect(loadGame()).toEqual(s);
    expect(deleteSave()).toBe(true);
    expect(loadGame()).toBeNull();
  });
  it("rejeita JSON corrompido, schema parcial e referências inválidas", () => {
    expect(deserialize("{broken")).toBeNull();
    expect(deserialize('{"version":1}')).toBeNull();
    const s = ticks(createGame(13), 3);
    s.incidents[0].eventId = "missing";
    expect(deserialize(serialize(s))).toBeNull();
  });
  it("salva configurações e trata storage bloqueado", () => {
    expect(saveSettings({ ...defaultSettings, speed: 4 })).toBe(true);
    expect(loadSettings().speed).toBe(4);
    vi.stubGlobal("localStorage", {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("quota");
      },
      removeItem() {
        throw Error("blocked");
      },
    });
    expect(saveGame(createGame(13))).toBe(false);
    expect(loadGame()).toBeNull();
    expect(deleteSave()).toBe(false);
  });
  it("rejeita campos de backup que poderiam quebrar a interface", () => {
    const s = createGame(13);
    expect(deserialize(JSON.stringify({ ...s, night: 1.5 }))).toBeNull();
    expect(
      deserialize(JSON.stringify({ ...s, failure: { message: "inválido" } })),
    ).toBeNull();
    expect(
      deserialize(JSON.stringify({ ...s, documents: ["constructor"] })),
    ).toBeNull();
  });
});
