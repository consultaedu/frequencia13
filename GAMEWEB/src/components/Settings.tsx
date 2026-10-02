import type { Settings as Options } from "../game/types";
import { useState } from "react";
export default function Settings({
  settings,
  change,
}: {
  settings: Options;
  change: (s: Options) => void;
}) {
  const [message, setMessage] = useState("");
  return (
    <div className="settings-grid">
      {(
        [
          ["master", "Volume geral"],
          ["effects", "Volume dos efeitos"],
          ["glitch", "Intensidade de interferência"],
        ] as const
      ).map(([key, label]) => (
        <label className="setting" key={key}>
          <span>
            {label}
            <small>{Math.round(settings[key] * 100)}%</small>
          </span>
          <input
            aria-label={label}
            type="range"
            min="0"
            max="1"
            step=".05"
            value={settings[key]}
            onChange={(e) =>
              change({ ...settings, [key]: Number(e.target.value) })
            }
          />
        </label>
      ))}
      <label className="setting">
        <span>Velocidade do turno</span>
        <select
          value={settings.speed}
          onChange={(e) =>
            change({ ...settings, speed: Number(e.target.value) })
          }
        >
          <option value="0.5">0,5× — tranquilo</option>
          <option value="1">1× — 1 minuto por segundo</option>
          <option value="2">2× — acelerado</option>
          <option value="4">4× — turno rápido</option>
        </select>
      </label>
      <label className="toggle-setting">
        <input
          type="checkbox"
          checked={settings.scanlines}
          onChange={(e) => change({ ...settings, scanlines: e.target.checked })}
        />{" "}
        Linhas de varredura (CRT)
      </label>
      <label className="toggle-setting">
        <input
          type="checkbox"
          checked={settings.reduced}
          onChange={(e) => change({ ...settings, reduced: e.target.checked })}
        />{" "}
        Reduzir movimento e piscadas
      </label>
      <button
        disabled={!document.fullscreenEnabled}
        onClick={() => {
          const promise = document.fullscreenElement
            ? document.exitFullscreen()
            : document.documentElement.requestFullscreen();
          void promise.catch(() =>
            setMessage("O navegador não permitiu alterar a tela cheia."),
          );
        }}
      >
        {document.fullscreenEnabled
          ? "ALTERNAR TELA CHEIA"
          : "TELA CHEIA INDISPONÍVEL"}
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
