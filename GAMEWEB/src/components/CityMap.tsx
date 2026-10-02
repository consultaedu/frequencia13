import { locations } from "../data/world";
import { eventById } from "../events/catalog";
import type { GameState } from "../game/types";
export default function CityMap({
  game,
  onIncident,
}: {
  game?: GameState;
  onIncident?: (id: string) => void;
}) {
  return (
    <div className="city-map">
      <svg
        className="map-drawing"
        viewBox="0 0 1000 740"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="grid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="#344333"
              strokeWidth=".6"
            />
          </pattern>
          <pattern
            id="trees"
            width="27"
            height="27"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="m7 19 7-12 7 12z"
              fill="none"
              stroke="#394b36"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="1000" height="740" fill="#151c17" />
        <rect width="1000" height="740" fill="url(#grid)" opacity=".6" />
        <path d="M710 0h290v290L877 309 784 231 730 163Z" fill="url(#trees)" />
        <path
          d="M0 570Q170 520 190 600T470 688 780 649 1000 722"
          fill="none"
          stroke="#263d36"
          strokeWidth="38"
        />
        <path
          d="M0 570Q170 520 190 600T470 688 780 649 1000 722"
          fill="none"
          stroke="#476356"
          strokeWidth="1"
        />
        <g fill="#20291f" stroke="#384233" strokeWidth="1">
          {Array.from({ length: 36 }, (_, i) => {
            const x = 260 + (i % 6) * 65;
            const y = 205 + Math.floor(i / 6) * 57;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={40 + (i % 3) * 3}
                height={31}
                rx="2"
              />
            );
          })}
        </g>
        <g fill="none" stroke="#4e5744" strokeWidth="8">
          <path d="M0 270 210 270 340 150 620 150 758 278 1000 278" />
          <path d="M235 740V450L240 280 440 280 440 0" />
          <path d="M0 480H700L850 610 1000 610" />
          <path d="M640 0v410l80 110v220" />
          <path d="M0 95 140 135 230 270" />
          <path d="m360 740 0-360 230 0 178-100L850 0" />
        </g>
        <g fill="none" stroke="#1b231b" strokeWidth="4">
          <path d="M0 270 210 270 340 150 620 150 758 278 1000 278" />
          <path d="M235 740V450L240 280 440 280 440 0" />
          <path d="M0 480H700L850 610 1000 610" />
          <path d="M640 0v410l80 110v220" />
          <path d="M0 95 140 135 230 270" />
          <path d="m360 740 0-360 230 0 178-100L850 0" />
        </g>
        <path
          d="M525 0V740"
          stroke="#4a5043"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
        <g
          fill="#78836b"
          fontFamily="monospace"
          fontSize="12"
          letterSpacing="3"
        >
          <text x="70" y="690">
            RIO DO CEDRO
          </text>
          <text x="764" y="340" transform="rotate(0 764 340)">
            ESTRADA 13
          </text>
          <text x="770" y="62">
            RESERVA FLORESTAL
          </text>
          <text x="285" y="590">
            SANTA AURORA
          </text>
        </g>
      </svg>
      <div className="map-coordinates">
        SA / SETOR MUNICIPAL
        <br />
        23°18′ S — 46°41′ O
      </div>
      <div className="compass">
        N<br />↑
      </div>
      {locations.map((l) => {
        const incident = game?.incidents.find(
          (i) =>
            eventById(i.eventId).location === l.id &&
            (i.status === "pending" || i.status === "dispatched"),
        );
        return (
          <button
            type="button"
            className={`map-point ${l.id === "central" ? "base" : ""} ${incident ? "active" : ""}`}
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
            key={l.id}
            onClick={() => incident && onIncident?.(incident.id)}
            disabled={!incident}
            aria-label={`${l.name}${incident ? " — ocorrência ativa" : ""}`}
          >
            <span className="point-symbol">
              {incident ? "!" : l.id === "central" ? "⌂" : "·"}
            </span>
            <span className="point-label">{l.name}</span>
            {["central", "hospital", "escola", "estacao", "estrada"].includes(
              l.id,
            ) && <small className="camera-dot">▣</small>}
          </button>
        );
      })}
      {game &&
        game.hiddenUntil <= game.minute &&
        game.units
          .filter(
            (u) =>
              u.status !== "indisponível" && u.status !== "sem comunicação",
          )
          .map((u) => {
            const l = locations.find((l) => l.id === u.location)!;
            return (
              <div
                className={`unit-marker ${u.status === "deslocando" ? "moving" : ""}`}
                style={{ left: `${l.x + (u.id - 2) * 3}%`, top: `${l.y + 8}%` }}
                key={u.id}
              >
                U0{u.id}
              </div>
            );
          })}
      {game && game.hiddenUntil > game.minute && (
        <div className="map-warning">RASTREAMENTO INDISPONÍVEL</div>
      )}
      <div className="map-scale">
        <span /> 250 m
      </div>
    </div>
  );
}
