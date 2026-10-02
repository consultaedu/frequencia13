export type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "VERY_RARE";
export type UnitStatus =
  | "disponível"
  | "deslocando"
  | "no local"
  | "retornando"
  | "sem comunicação"
  | "indisponível";
export type Phase = "playing" | "won" | "lost" | "complete";
export type Flag =
  "protocol" | "echo" | "warned" | "sealed" | "operator" | "archive" | "signal";
export interface Consequence {
  power?: number;
  signal?: number;
  danger?: number;
  flag?: Flag;
  document?: string;
  message: string;
}
export interface Choice {
  id: string;
  label: string;
  hint: string;
  dispatch?: boolean;
  consequences: Consequence;
}
export interface GameEvent {
  id: string;
  night: number;
  timeWindow: [number, number];
  location: string;
  title: string;
  description: string;
  caller: string;
  rarity: Rarity;
  choices: Choice[];
  requirements?: {
    flag?: Flag;
    power?: number;
    availableUnit?: boolean;
    event?: string;
  };
  followUp?: string;
  mandatory?: boolean;
  camera?: number;
  risk?: boolean;
}
export interface Incident {
  id: string;
  eventId: string;
  time: number;
  expires: number;
  status: "pending" | "dispatched" | "resolved" | "ignored";
  choice?: string;
}
export interface Unit {
  id: number;
  name: string;
  status: UnitStatus;
  location: string;
  until: number;
  incident?: string;
}
export interface Log {
  time: number;
  sender: string;
  text: string;
  type: "info" | "warning" | "danger";
}
export interface Systems {
  cameras: boolean;
  radio: boolean;
  lights: boolean;
  auxiliary: boolean;
}
export interface GameState {
  version: 1;
  seed: number;
  rng: number;
  night: number;
  minute: number;
  phase: Phase;
  paused: boolean;
  power: number;
  signal: number;
  danger: number;
  units: Unit[];
  incidents: Incident[];
  seen: string[];
  flags: Partial<Record<Flag, boolean>>;
  documents: string[];
  decisions: string[];
  logs: Log[];
  systems: Systems;
  hiddenUntil: number;
  failure?: string;
  resolved: number;
  ignored: number;
  cameraVisits: number[];
  camera: number;
  charges: number;
  checkpoint?: string;
}
export interface Settings {
  master: number;
  effects: number;
  glitch: number;
  scanlines: boolean;
  reduced: boolean;
  speed: number;
}
export type Action =
  | { type: "TICK" }
  | { type: "PAUSE" }
  | { type: "CHOOSE"; incident: string; choice: string; unit?: number }
  | { type: "TOGGLE"; system: keyof Systems }
  | { type: "REPAIR"; system: "power" | "signal" | "units" }
  | { type: "CAMERA"; camera: number }
  | { type: "COMMAND"; command: string }
  | { type: "NEXT" };
