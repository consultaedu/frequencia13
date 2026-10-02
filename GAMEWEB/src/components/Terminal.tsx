import { useState } from "react";
import type { Action, GameState, Settings } from "../game/types";
import { clock } from "../game/GameClock";
import { cameraState } from "../game/CameraSystem";
import { sound } from "../game/AudioSystem";
export default function Terminal({
  game,
  dispatch,
  settings,
}: {
  game: GameState;
  dispatch: (a: Action) => void;
  settings: Settings;
}) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([
    "SA-OS 3.13 / ACESSO LOCAL",
    "Sessão autenticada. Digite help para consultar os comandos.",
  ]);
  function run() {
    const cmd = input.trim().toLowerCase();
    if (!cmd) return;
    setInput("");
    sound("key", settings);
    if (cmd === "clear") {
      setHistory([]);
      return;
    }
    const responses: Record<string, string> = {
      help: "help · status · time · units · cameras · power · clear · logs",
      status: `NOITE ${game.night} / ENERGIA ${Math.ceil(game.power)}% / SINAL ${Math.ceil(game.signal)}% / RISCO ${Math.ceil(game.danger)}%`,
      time: `${clock(game.minute)} — turno encerra às 06:00`,
      units: game.units.map((u) => `${u.name}: ${u.status}`).join("\n"),
      cameras: Array.from(
        { length: 8 },
        (_, i) => `CAM 0${i + 1}: ${cameraState(game, i)}`,
      ).join("\n"),
      power: `Reserva ${Math.ceil(game.power)}%. Gerador: ${game.charges} cargas. Controles em SISTEMA.`,
      logs: game.logs
        .slice(-10)
        .map((l) => `[${clock(l.time)}] ${l.sender}: ${l.text}`)
        .join("\n"),
    };
    let response = responses[cmd];
    if (cmd === "archive 13" && game.documents.includes("employee"))
      response = "ARQUIVO RECUPERADO → INCIDENTE_13.pdf";
    if (
      cmd === "signal" &&
      (game.documents.includes("incident") ||
        game.documents.includes("protocol"))
    )
      response = game.flags.signal
        ? "A portadora já está isolada. Nenhuma resposta."
        : "Portadora 13 isolada. Sinal restabelecido. Não responda à voz.";
    if (
      cmd === "operator" &&
      (game.documents.includes("operator") ||
        game.documents.includes("protocol"))
    )
      response =
        "MATRÍCULA 013. Substituição não autorizada. Documento recuperado.";
    dispatch({ type: "COMMAND", command: cmd });
    setHistory((h) => [
      ...h.slice(-60),
      `operador@central:~$ ${cmd}`,
      response ?? `Comando não reconhecido: ${cmd}`,
    ]);
  }
  return (
    <div className="terminal">
      <div className="terminal-history" role="log">
        {history.map((line, i) => (
          <pre key={i}>{line}</pre>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run();
        }}
      >
        <label htmlFor="command">operador@central:~$</label>
        <input
          id="command"
          aria-label="Comando do terminal"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit">EXECUTAR ↵</button>
      </form>
    </div>
  );
}
