import { useState } from "react";
import type { Action, GameState, Incident } from "../game/types";
import { eventById } from "../events/catalog";
import { place } from "../data/world";
import { clock } from "../game/GameClock";
import Icon from "./Icon";
export function CallDetail({
  game,
  incident,
  dispatch,
}: {
  game: GameState;
  incident: Incident;
  dispatch: (a: Action) => void;
}) {
  const event = eventById(incident.eventId);
  const [unit, setUnit] = useState(0);
  const available = game.units.filter((u) => u.status === "disponível");
  const selected = available.find((u) => u.id === unit)?.id ?? available[0]?.id;
  return (
    <article className="call-detail">
      <div className="eyebrow amber">
        LINHA {String(game.incidents.indexOf(incident) + 1).padStart(2, "0")} /{" "}
        {incident.status === "pending"
          ? "CONEXÃO ESTABELECIDA"
          : incident.status === "dispatched"
            ? "EQUIPE EM ATENDIMENTO"
            : "LIGAÇÃO ENCERRADA"}
      </div>
      <h2>{event.title}</h2>
      <dl className="call-meta">
        <div>
          <dt>ORIGEM</dt>
          <dd>{place(event.location)}</dd>
        </div>
        <div>
          <dt>REGISTRO</dt>
          <dd>{clock(incident.time)}</dd>
        </div>
      </dl>
      <div className="caller">
        <Icon name="phone" />
        <span>{event.caller}</span>
        <div className="waveform">
          {Array.from({ length: 15 }, (_, i) => (
            <i
              key={i}
              style={{
                height: `${6 + ((i * 7) % 19)}px`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      </div>
      <blockquote>“{event.description}”</blockquote>
      {incident.status === "pending" ? (
        <>
          <div className="response-label">
            PROTOCOLO DE RESPOSTA{" "}
            <span>{incident.expires - game.minute} min restantes</span>
          </div>
          <label className="unit-select">
            Unidade para despacho
            <select
              aria-label="Unidade para despacho"
              value={selected ?? ""}
              onChange={(e) => setUnit(Number(e.target.value))}
            >
              {available.length ? (
                available.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))
              ) : (
                <option value="">Nenhuma disponível</option>
              )}
            </select>
          </label>
          <div className="choices">
            {event.choices.map((c) => (
              <button
                key={c.id}
                disabled={
                  c.dispatch &&
                  (!selected ||
                    !game.systems.radio ||
                    game.signal < 10 ||
                    game.power < 2)
                }
                onClick={() =>
                  dispatch({
                    type: "CHOOSE",
                    incident: incident.id,
                    choice: c.id,
                    unit: selected,
                  })
                }
              >
                <span>{c.label}</span>
                <small>{c.hint}</small>
                <Icon name="arrow" size={16} />
              </button>
            ))}
          </div>
          {!game.systems.radio && (
            <p className="amber">Ligue o rádio em SISTEMA para despachar.</p>
          )}
        </>
      ) : (
        <div className="call-outcome">
          <span>DECISÃO REGISTRADA</span>
          <p>
            {event.choices.find((c) => c.id === incident.choice)?.label ??
              "Prazo de atendimento expirado."}
          </p>
          {incident.status === "resolved" && (
            <p>
              {
                event.choices.find((c) => c.id === incident.choice)
                  ?.consequences.message
              }
            </p>
          )}
        </div>
      )}
    </article>
  );
}
export default function Calls({
  game,
  dispatch,
  selected,
  select,
}: {
  game: GameState;
  dispatch: (a: Action) => void;
  selected: string | null;
  select: (id: string) => void;
}) {
  const incident =
    game.incidents.find((i) => i.id === selected) ??
    game.incidents.find((i) => i.status === "pending") ??
    game.incidents.at(-1);
  return (
    <div className="calls-layout">
      <div className="call-list">
        <div className="eyebrow">REGISTRO TELEFÔNICO</div>
        {[...game.incidents].reverse().map((i) => (
          <button
            className={`${incident?.id === i.id ? "selected" : ""}`}
            key={i.id}
            onClick={() => select(i.id)}
          >
            <span className={i.status === "pending" ? "amber" : "muted"}>
              {clock(i.time)} ·{" "}
              {i.status === "pending"
                ? "AGUARDANDO"
                : i.status === "dispatched"
                  ? "EM ATENDIMENTO"
                  : i.status === "resolved"
                    ? "ATENDIDA"
                    : "IGNORADA"}
            </span>
            <strong>{eventById(i.eventId).title}</strong>
            <small>{place(eventById(i.eventId).location)}</small>
          </button>
        ))}
        {!game.incidents.length && (
          <p className="empty">
            Nenhuma ligação registrada.
            <br />O plantão já começou.
          </p>
        )}
      </div>
      {incident ? (
        <CallDetail
          key={incident.id}
          game={game}
          incident={incident}
          dispatch={dispatch}
        />
      ) : (
        <div className="empty large">
          <Icon name="phone" size={46} />
          <h2>Aguardando a primeira chamada</h2>
          <p>
            Mantenha a linha livre. Você será avisado quando o telefone tocar.
          </p>
        </div>
      )}
    </div>
  );
}
