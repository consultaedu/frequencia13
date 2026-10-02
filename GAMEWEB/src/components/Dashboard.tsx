import { useState } from "react";
import type {
  Action,
  GameState,
  Settings as Options,
  Systems,
} from "../game/types";
import Icon, { type IconName } from "./Icon";
import CityMap from "./CityMap";
import CameraView from "./CameraView";
import Calls from "./Calls";
import Terminal from "./Terminal";
import Settings from "./Settings";
import { cameras, documents, nightTitles, place } from "../data/world";
import { clock } from "../game/GameClock";
import { eventById } from "../events/catalog";
import { cameraState } from "../game/CameraSystem";
const tabs: { id: IconName; label: string; subtitle: string }[] = [
  { id: "map", label: "Mapa", subtitle: "VISÃO GERAL DA CIDADE" },
  {
    id: "camera",
    label: "Câmeras",
    subtitle: "CIRCUITO FECHADO DE VIGILÂNCIA",
  },
  { id: "phone", label: "Chamadas", subtitle: "CENTRAL DE ATENDIMENTO" },
  { id: "radio", label: "Rádio", subtitle: "CANAL OPERACIONAL / 156.130 MHz" },
  { id: "units", label: "Equipes", subtitle: "DESPACHO E RASTREAMENTO" },
  {
    id: "folder",
    label: "Arquivos",
    subtitle: "ACERVO MUNICIPAL / ACESSO RESTRITO",
  },
  {
    id: "terminal",
    label: "Terminal",
    subtitle: "SA-OS / INTERFACE DE COMANDOS",
  },
  { id: "system", label: "Sistema", subtitle: "RECURSOS E CONFIGURAÇÕES" },
];
function Meter({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: IconName;
}) {
  return (
    <div className={`meter ${value < 25 ? "critical" : ""}`}>
      <Icon name={icon} size={16} />
      <span>{label}</span>
      <strong>
        {Math.ceil(value)}
        <small>%</small>
      </strong>
      <div className="meter-track">
        <i style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
export function RadioLog({
  game,
  compact = false,
}: {
  game: GameState;
  compact?: boolean;
}) {
  return (
    <div className={`radio-log ${compact ? "short" : ""}`} role="log">
      {!game.systems.radio && (
        <p className="amber">
          RECEPTOR DESLIGADO · mensagens preservadas no registro local
        </p>
      )}
      {[...game.logs]
        .reverse()
        .slice(0, compact ? 5 : 100)
        .map((l, i) => (
          <div
            key={`${game.logs.length - i}-${l.time}`}
            className={`log ${l.type}`}
          >
            <time>{clock(l.time)}</time>
            <div>
              <strong>{l.sender}</strong>
              <p>{l.text}</p>
            </div>
          </div>
        ))}
    </div>
  );
}
export default function Dashboard({
  game,
  dispatch,
  settings,
  changeSettings,
  menu,
  erase,
  storageError,
}: {
  game: GameState;
  dispatch: (a: Action) => void;
  settings: Options;
  changeSettings: (s: Options) => void;
  menu: () => void;
  erase: () => void;
  storageError: boolean;
}) {
  const [tab, setTab] = useState<IconName>("map");
  const [selected, select] = useState<string | null>(null);
  const [doc, setDoc] = useState("manual");
  const pending = game.incidents.filter((i) => i.status === "pending");
  const available = game.units.filter((u) => u.status === "disponível").length;
  const activeTab = tabs.find((t) => t.id === tab)!;
  const openIncident = (id: string) => {
    select(id);
    setTab("phone");
  };
  let tutorial =
    game.minute < 3
      ? "Seu primeiro plantão. Observe o mapa enquanto aguarda a primeira ligação."
      : !game.decisions.length
        ? "O telefone está tocando. Abra CHAMADAS, selecione uma unidade e escolha uma resposta."
        : game.units.some((u) => u.status === "deslocando")
          ? "A equipe está a caminho. Acompanhe o marcador no MAPA e o prazo em EQUIPES."
          : game.minute < 70
            ? "Abra CÂMERAS para observar a cidade. Desligue setores em SISTEMA para poupar energia."
            : "Atenda antes do prazo. Leia os documentos encontrados e acompanhe as mensagens de rádio.";
  return (
    <div className="workstation">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            13<span>F</span>
          </div>
          <div>
            <h1>
              FREQUÊNCIA <b>13</b>
            </h1>
            <span>CENTRAL DE MONITORAMENTO</span>
          </div>
        </div>
        <div className="municipal">
          PREFEITURA DE SANTA AURORA<span>DIVISÃO DE VIGILÂNCIA MUNICIPAL</span>
        </div>
        <div className="connection">
          <i /> CONEXÃO LOCAL<span>OPERADOR 013</span>
        </div>
      </header>
      <div className="resource-bar">
        <div className="night">
          <span>TURNO NOTURNO</span>
          <strong>
            NOITE {String(game.night).padStart(2, "0")} <small>/ 07</small>
          </strong>
        </div>
        <Meter label="ENERGIA" value={game.power} icon="power" />
        <Meter label="SINAL" value={game.signal} icon="radio" />
        <div className="stat">
          <Icon name="units" />
          <span>
            EQUIPES
            <strong>
              {available}
              <small> / 3</small>
            </strong>
          </span>
        </div>
        <button
          className={`stat calls-stat ${pending.length ? "has-calls" : ""}`}
          onClick={() => setTab("phone")}
        >
          <Icon name="phone" />
          <span>
            PENDENTES<strong>{String(pending.length).padStart(2, "0")}</strong>
          </span>
        </button>
        <div className="shift-clock">
          <span>HORÁRIO DO TURNO</span>
          <strong>
            {clock(game.minute)}
            <small>:00</small>
          </strong>
          <span>ENCERRA ÀS 06:00</span>
        </div>
        <button
          className="pause-button"
          aria-label="Pausar turno"
          onClick={() => dispatch({ type: "PAUSE" })}
        >
          <Icon name="pause" />
        </button>
      </div>
      <div className="workspace-body">
        <aside className="sidebar">
          <div className="eyebrow">OPERAÇÕES</div>
          <nav>
            {tabs.map((t, i) => (
              <button
                key={t.id}
                className={`${tab === t.id ? "active" : ""} ${t.id === "phone" && pending.length ? "notify" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <Icon name={t.id} />
                <span>{t.label}</span>
                <small>
                  {t.id === "phone" && pending.length
                    ? pending.length
                    : String(i + 1).padStart(2, "0")}
                </small>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="signal-bars">▂ ▃ ▅ ▆ █</div>
            <span>156.130 MHz</span>
            <small>CANAL RESERVADO</small>
            <button onClick={menu}>SAIR PARA O MENU ↗</button>
          </div>
        </aside>
        <main className="workspace-main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">SANTA AURORA / {activeTab.subtitle}</div>
              <h2>
                {tab === "map" ? "Monitoramento da cidade" : activeTab.label}
                <span className="heading-slash">/</span>
              </h2>
            </div>
            <span className="live-badge">
              <i /> SISTEMA ATIVO
            </span>
          </div>
          {storageError && (
            <div role="alert" className="notice danger">
              Não foi possível salvar no navegador. Libere o armazenamento para
              preservar o progresso.
            </div>
          )}
          {game.night === 1 && (
            <div className="tutorial">
              <span>GUIA DO OPERADOR</span>
              {tutorial}
            </div>
          )}
          {game.night > 1 && (
            <div className="night-caption">
              REGISTRO {String(game.night).padStart(2, "0")}{" "}
              <span>{nightTitles[game.night - 1]}</span>
              <small>Não abandone seu posto.</small>
            </div>
          )}
          {tab === "map" && (
            <div className="overview">
              <section className="panel map-panel">
                <div className="panel-title">
                  <span>
                    <Icon name="map" size={16} /> MAPA OPERACIONAL
                  </span>
                  <small>SETOR 01 — PERÍMETRO URBANO</small>
                </div>
                <CityMap game={game} onIncident={openIncident} />
                <div className="map-legend">
                  <span>
                    <i className="green-dot" /> Unidade
                  </span>
                  <span>
                    <i className="amber-dot" /> Ocorrência
                  </span>
                  <span>▣ Câmera</span>
                  <small>ATUALIZAÇÃO EM TEMPO REAL</small>
                </div>
              </section>
              <aside className="overview-right">
                <section className="panel">
                  <div className="panel-title">
                    <span>
                      <Icon name="camera" size={16} /> VIGILÂNCIA
                    </span>
                    <button onClick={() => setTab("camera")}>ABRIR ↗</button>
                  </div>
                  <CameraView game={game} camera={game.camera} compact />
                  <div className="camera-caption">
                    CAM {String(game.camera + 1).padStart(2, "0")}{" "}
                    <span>{cameras[game.camera]}</span>
                  </div>
                </section>
                <section className="panel unit-summary">
                  <div className="panel-title">
                    <span>
                      <Icon name="units" size={16} /> UNIDADES EM CAMPO
                    </span>
                    <small>{available}/3 LIVRES</small>
                  </div>
                  {game.units.map((u) => (
                    <div key={u.id}>
                      <span
                        className={`unit-led ${u.status === "disponível" ? "" : "busy"}`}
                      />
                      <strong>{u.name}</strong>
                      <small>
                        {game.hiddenUntil > game.minute
                          ? "sem rastreamento"
                          : u.status}
                      </small>
                    </div>
                  ))}
                </section>
                <section
                  className={`panel pending-card ${pending.length ? "ringing" : ""}`}
                >
                  <Icon name="phone" size={24} />
                  <div>
                    <strong>
                      {pending.length
                        ? `${pending.length} chamada${pending.length > 1 ? "s" : ""} aguardando`
                        : "Linha disponível"}
                    </strong>
                    <p>
                      {pending.length
                        ? eventById(pending[0].eventId).title
                        : "Nenhuma ligação pendente"}
                    </p>
                  </div>
                  {pending.length > 0 && (
                    <button onClick={() => openIncident(pending[0].id)}>
                      ATENDER ↗
                    </button>
                  )}
                </section>
              </aside>
              <section className="panel radio-preview">
                <div className="panel-title">
                  <span>
                    <Icon name="radio" size={16} /> TRÁFEGO DE RÁDIO
                  </span>
                  <button onClick={() => setTab("radio")}>
                    VER REGISTRO ↗
                  </button>
                </div>
                <RadioLog game={game} compact />
              </section>
            </div>
          )}
          {tab === "phone" && (
            <section className="panel">
              <Calls
                game={game}
                dispatch={dispatch}
                selected={selected}
                select={select}
              />
            </section>
          )}
          {tab === "camera" && (
            <section className="camera-layout">
              <div className="panel">
                <CameraView game={game} camera={game.camera} />
                <div className="camera-caption">
                  CAM {String(game.camera + 1).padStart(2, "0")}{" "}
                  <span>{cameras[game.camera]}</span>
                  <small>
                    As gravações nem sempre concordam com o relógio.
                  </small>
                </div>
              </div>
              <div className="camera-grid">
                {cameras.map((name, i) => (
                  <button
                    className={game.camera === i ? "selected" : ""}
                    onClick={() => dispatch({ type: "CAMERA", camera: i })}
                    key={name}
                  >
                    <Icon name="camera" />
                    <strong>CAM 0{i + 1}</strong>
                    <span>{name}</span>
                    <small
                      className={
                        cameraState(game, i) === "NORMAL" ? "green" : "amber"
                      }
                    >
                      ● {cameraState(game, i)}
                    </small>
                  </button>
                ))}
              </div>
            </section>
          )}
          {tab === "radio" && (
            <section className="panel radio-full">
              <div className="panel-title">
                <span>REGISTRO DE TRANSMISSÕES</span>
                <small>
                  {game.systems.radio ? "RECEPTOR ATIVO" : "RECEPTOR DESLIGADO"}
                </small>
              </div>
              <div className="radio-tuner">
                <Icon name="radio" size={34} />
                <strong>
                  156.130 <small>MHz</small>
                </strong>
                <span>▁ ▂ ▁ ▄ ▇ ▃ ▁ ▅ ▂ ▆ ▃ ▁</span>
                <button
                  disabled={game.signal >= 95 || game.power < 7}
                  onClick={() => dispatch({ type: "REPAIR", system: "signal" })}
                >
                  RESTAURAR ENLACE · −7% ENERGIA
                </button>
              </div>
              <RadioLog game={game} />
            </section>
          )}
          {tab === "units" && (
            <>
              <div className="units-grid">
                {game.units.map((u) => (
                  <section className="panel unit-card" key={u.id}>
                    <div className="unit-number">0{u.id}</div>
                    <h3>{u.name}</h3>
                    <span
                      className={u.status === "disponível" ? "green" : "amber"}
                    >
                      ● {u.status.toUpperCase()}
                    </span>
                    <dl>
                      <dt>LOCALIZAÇÃO</dt>
                      <dd>
                        {game.hiddenUntil > game.minute
                          ? "Sinal de rastreamento perdido"
                          : place(u.location)}
                      </dd>
                      <dt>PRÓXIMA ATUALIZAÇÃO</dt>
                      <dd>
                        {u.until
                          ? `${Math.max(0, u.until - game.minute)} minutos`
                          : "Aguardando despacho"}
                      </dd>
                    </dl>
                    <button onClick={() => setTab("phone")}>
                      ABRIR OCORRÊNCIAS <Icon name="arrow" size={16} />
                    </button>
                  </section>
                ))}
              </div>
              <div className="notice">
                <span>CONTATO DE EMERGÊNCIA</span>
                <p>
                  Equipes sem comunicação podem ser orientadas de volta antes
                  que o prazo de busca termine.
                </p>
                <button
                  disabled={
                    game.power < 10 ||
                    !game.systems.radio ||
                    !game.units.some((u) => u.status === "sem comunicação")
                  }
                  onClick={() => dispatch({ type: "REPAIR", system: "units" })}
                >
                  RECUPERAR CONTATO · −10% ENERGIA
                </button>
              </div>
            </>
          )}
          {tab === "folder" && (
            <section className="panel files-layout">
              <div className="file-list">
                <div className="eyebrow">
                  {game.documents.length} DOCUMENTOS RECUPERADOS
                </div>
                {game.documents.map((id) => (
                  <button
                    key={id}
                    onClick={() => setDoc(id)}
                    className={doc === id ? "selected" : ""}
                  >
                    <Icon name="folder" size={18} />
                    {documents[id].title}
                  </button>
                ))}
                <p>Documentos são recuperados em chamadas e investigações.</p>
              </div>
              <article className="document">
                <div className="document-stamp">
                  SANTA AURORA
                  <br />
                  ARQUIVO MUNICIPAL
                </div>
                <h3>{documents[doc]?.title ?? documents.manual.title}</h3>
                <pre>{documents[doc]?.content ?? documents.manual.content}</pre>
                <footer>
                  DOCUMENTO DIGITALIZADO / CÓPIA LOCAL / NÃO DISTRIBUIR
                </footer>
              </article>
            </section>
          )}
          {tab === "terminal" && (
            <section className="panel">
              <div className="panel-title">
                <span>TERMINAL LOCAL</span>
                <small>OPERADOR@CENTRAL</small>
              </div>
              <Terminal game={game} dispatch={dispatch} settings={settings} />
            </section>
          )}
          {tab === "system" && (
            <div className="system-layout">
              <section className="panel padded">
                <div className="eyebrow">GERENCIAMENTO DE RECURSOS</div>
                <h3>Alimentação da central</h3>
                <div className="power-big">
                  {Math.ceil(game.power)}
                  <small>%</small>
                  <span>RESERVA DE ENERGIA</span>
                </div>
                {(
                  [
                    ["cameras", "Circuito de câmeras", "Consome 0,045% / min"],
                    [
                      "radio",
                      "Rádio e comunicação",
                      "Permite despachar e recuperar unidades",
                    ],
                    [
                      "lights",
                      "Iluminação da central",
                      "Apagar aumenta o risco",
                    ],
                    [
                      "auxiliary",
                      "Equipamentos auxiliares",
                      "Consome 0,027% / min",
                    ],
                  ] as [keyof Systems, string, string][]
                ).map(([id, label, hint]) => (
                  <button
                    className="system-switch"
                    key={id}
                    onClick={() => dispatch({ type: "TOGGLE", system: id })}
                  >
                    <span>
                      {label}
                      <small>{hint}</small>
                    </span>
                    <b className={game.systems[id] ? "on" : ""}>
                      {game.systems[id] ? "LIGADO" : "DESLIGADO"}
                    </b>
                  </button>
                ))}
                <button
                  className="primary generator"
                  disabled={game.charges === 0 || game.power >= 95}
                  onClick={() => dispatch({ type: "REPAIR", system: "power" })}
                >
                  ACIONAR GERADOR · +28% <small>{game.charges} CARGAS</small>
                </button>
                <button
                  disabled={game.signal >= 95 || game.power < 7}
                  onClick={() => dispatch({ type: "REPAIR", system: "signal" })}
                >
                  RESTAURAR SINAL · −7% ENERGIA
                </button>
                <p className="muted">
                  Integridade da central:{" "}
                  {Math.max(0, Math.round(100 - game.danger))}%
                </p>
              </section>
              <section className="panel padded">
                <div className="eyebrow">PREFERÊNCIAS DO OPERADOR</div>
                <h3>Configurações</h3>
                <p className="muted">
                  O turno continua. Pause antes de fazer ajustes demorados.
                </p>
                <Settings settings={settings} change={changeSettings} />
                <div className="save-info">
                  SEED DA CAMPANHA <strong>{game.seed}</strong>
                  <span>SALVAMENTO AUTOMÁTICO LOCAL</span>
                </div>
                <button className="danger-button" onClick={erase}>
                  APAGAR PROGRESSO
                </button>
              </section>
            </div>
          )}
        </main>
      </div>
      <footer className="statusbar">
        <span>
          <i /> SA-OS v3.13 <b>•</b> SESSÃO SEGURA
        </span>
        <span>
          {pending.length
            ? `${pending.length} CHAMADA(S) REQUEREM ATENÇÃO`
            : "TODOS OS CANAIS MONITORADOS"}
        </span>
        <span>
          {storageError ? "ERRO AO SALVAR" : "PROGRESSO SALVO LOCALMENTE"}{" "}
          <b>▣</b>
        </span>
      </footer>
      {pending.length > 0 && tab !== "phone" && tab !== "map" && (
        <button
          className="incoming-toast"
          onClick={() => openIncident(pending[0].id)}
        >
          <Icon name="phone" /> CHAMADA RECEBIDA{" "}
          <span>{eventById(pending[0].eventId).caller}</span> ATENDER ↗
        </button>
      )}
      {game.paused && (
        <div className="modal-backdrop">
          <section className="modal">
            <div className="eyebrow">RELÓGIO SUSPENSO</div>
            <h2>Turno pausado</h2>
            <p>A cidade pode esperar por um momento.</p>
            <strong className="pause-time">{clock(game.minute)}</strong>
            <button
              className="primary"
              onClick={() => dispatch({ type: "PAUSE" })}
            >
              RETOMAR TURNO <Icon name="play" />
            </button>
            <Settings settings={settings} change={changeSettings} />
            <button onClick={menu}>SALVAR E VOLTAR AO MENU</button>
          </section>
        </div>
      )}
    </div>
  );
}
