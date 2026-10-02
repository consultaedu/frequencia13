import type { GameState, Settings } from "./types";
import { events } from "../events/catalog";
import { documents, locations } from "../data/world";
export const SAVE_KEY = "frequencia13.save.v1";
const SETTINGS_KEY = "frequencia13.settings.v1";
export const defaultSettings: Settings = {
  master: 0.45,
  effects: 0.6,
  glitch: 0.35,
  scanlines: true,
  reduced: false,
  speed: 1,
};
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const number = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
export function validGame(v: unknown): v is GameState {
  if (
    !record(v) ||
    v.version !== 1 ||
    !number(v.seed, 0, 4294967295) ||
    !number(v.rng, 0, 4294967295) ||
    !number(v.night, 1, 7) ||
    !number(v.minute, 0, 360)
  )
    return false;
  if (
    !["playing", "won", "lost", "complete"].includes(String(v.phase)) ||
    typeof v.paused !== "boolean"
  )
    return false;
  if (v.failure !== undefined && typeof v.failure !== "string") return false;
  if (
    ![
      v.seed,
      v.rng,
      v.night,
      v.minute,
      v.camera,
      v.charges,
      v.resolved,
      v.ignored,
    ].every(Number.isInteger)
  )
    return false;
  if (
    !["power", "signal", "danger"].every((k) => number(v[k], 0, 110)) ||
    !number(v.hiddenUntil, 0, 500) ||
    !number(v.charges, 0, 2) ||
    !number(v.camera, 0, 7) ||
    !number(v.resolved, 0, 1000) ||
    !number(v.ignored, 0, 1000)
  )
    return false;
  if (
    !record(v.flags) ||
    !Object.values(v.flags).every((x) => typeof x === "boolean") ||
    !record(v.systems) ||
    !["cameras", "radio", "lights", "auxiliary"].every(
      (k) => typeof (v.systems as Record<string, unknown>)[k] === "boolean",
    )
  )
    return false;
  if (
    !strings(v.documents) ||
    !v.documents.every((d) => Object.hasOwn(documents, d)) ||
    !strings(v.seen) ||
    !strings(v.decisions)
  )
    return false;
  if (
    !Array.isArray(v.cameraVisits) ||
    v.cameraVisits.length !== 8 ||
    !v.cameraVisits.every((x) => number(x, 0, 1e9))
  )
    return false;
  if (
    !Array.isArray(v.units) ||
    v.units.length !== 3 ||
    !v.units.every(
      (u) =>
        record(u) &&
        number(u.id, 1, 3) &&
        typeof u.name === "string" &&
        [
          "disponível",
          "deslocando",
          "no local",
          "retornando",
          "sem comunicação",
          "indisponível",
        ].includes(String(u.status)) &&
        locations.some((l) => l.id === u.location) &&
        number(u.until, 0, 500),
    )
  )
    return false;
  if (
    !Array.isArray(v.incidents) ||
    !v.incidents.every(
      (i) =>
        record(i) &&
        typeof i.id === "string" &&
        events.some((e) => e.id === i.eventId) &&
        number(i.time, 0, 360) &&
        number(i.expires, 0, 500) &&
        ["pending", "dispatched", "resolved", "ignored"].includes(
          String(i.status),
        ),
    )
  )
    return false;
  if (
    !Array.isArray(v.logs) ||
    !v.logs.every(
      (l) =>
        record(l) &&
        number(l.time, 0, 360) &&
        typeof l.sender === "string" &&
        typeof l.text === "string" &&
        ["info", "warning", "danger"].includes(String(l.type)),
    )
  )
    return false;
  if (v.checkpoint !== undefined && typeof v.checkpoint !== "string")
    return false;
  return true;
}
export function serialize(s: GameState) {
  return JSON.stringify(s);
}
export function deserialize(raw: string | null): GameState | null {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    return validGame(value) ? value : null;
  } catch {
    return null;
  }
}
export function saveGame(s: GameState): boolean {
  try {
    localStorage.setItem(SAVE_KEY, serialize(s));
    return true;
  } catch {
    return false;
  }
}
export function loadGame(): GameState | null {
  try {
    return deserialize(localStorage.getItem(SAVE_KEY));
  } catch {
    return null;
  }
}
export function deleteSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch {
    return false;
  }
}
export function loadSettings(): Settings {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null");
    if (
      record(v) &&
      number(v.master, 0, 1) &&
      number(v.effects, 0, 1) &&
      number(v.glitch, 0, 1) &&
      [0.5, 1, 2, 4].includes(Number(v.speed)) &&
      typeof v.scanlines === "boolean" &&
      typeof v.reduced === "boolean"
    )
      return v as unknown as Settings;
  } catch {
    /* Storage may be disabled by the browser. */
  }
  return defaultSettings;
}
export function saveSettings(s: Settings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}
