import { useCallback, useEffect, useRef, useState } from "react";
import { createGame, gameReducer } from "../game/GameState";
import {
  loadGame,
  loadSettings,
  saveGame,
  saveSettings,
  deserialize,
} from "../game/SaveSystem";
import { REAL_MS_PER_GAME_MINUTE } from "../game/GameClock";
import { sound } from "../game/AudioSystem";
import { newSeed } from "../utils/random";
import type { Action, GameState } from "../game/types";
export function useGame() {
  const [game, setGame] = useState<GameState | null>(null);
  const [saved, setSaved] = useState(loadGame);
  const [settings, setSettings] = useState(loadSettings);
  const [storageError, setStorageError] = useState(false);
  const previous = useRef<GameState | null>(null);
  const dispatch = useCallback(
    (action: Action) => setGame((s) => (s ? gameReducer(s, action) : s)),
    [],
  );
  useEffect(() => {
    if (!saveSettings(settings)) setStorageError(true);
  }, [settings]);
  useEffect(() => {
    if (!game || game.paused || game.phase !== "playing") return;
    const timer = window.setInterval(
      () => dispatch({ type: "TICK" }),
      REAL_MS_PER_GAME_MINUTE / settings.speed,
    );
    return () => window.clearInterval(timer);
  }, [game?.paused, game?.phase, !!game, settings.speed, dispatch]);
  useEffect(() => {
    if (!game) {
      previous.current = null;
      return;
    }
    const old = previous.current;
    if (old && game.incidents.length > old.incidents.length)
      sound("phone", settings);
    else if (old && game.phase === "lost" && old.phase !== "lost")
      sound("alert", settings);
    else if (old && game.logs.length !== old.logs.length && game.systems.radio)
      sound("radio", settings);
    previous.current = game;
    if (saveGame(game)) setSaved(game);
    else setStorageError(true);
  }, [game, settings]);
  useEffect(() => {
    const onHide = () => {
      if (document.hidden)
        setGame((s) => (s?.phase === "playing" ? { ...s, paused: true } : s));
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);
  return {
    game,
    saved,
    settings,
    setSettings,
    importSave: (savedGame: GameState) => setSaved(savedGame),
    storageError,
    dispatch,
    start: () => setGame(createGame(newSeed())),
    resume: () => {
      const s = loadGame();
      if (s) setGame({ ...s, paused: false });
    },
    retry: () => {
      if (game)
        setGame(deserialize(game.checkpoint ?? "") ?? createGame(game.seed));
    },
    menu: () => setGame(null),
    clear: () => {
      setSaved(null);
      setGame(null);
    },
  };
}
