import { useState, type CSSProperties } from "react";
import { useGame } from "./hooks/useGame";
import { deleteSave } from "./game/SaveSystem";
import { unlockAudio, sound } from "./game/AudioSystem";
import { clock } from "./game/GameClock";
import { ending } from "./game/StoryFlags";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import SaveBackup from "./components/SaveBackup";
import CityMap from "./components/CityMap";
import Icon from "./components/Icon";
import { nightTitles } from "./data/world";
export default function App() {
  const g = useGame();
  const [screen, setScreen] = useState<
    "menu" | "intro" | "settings" | "credits"
  >("menu");
  const [confirm, setConfirm] = useState<"new" | "erase" | null>(null);
  const [notice, setNotice] = useState("");
  function newGame() {
    if (g.saved) setConfirm("new");
    else setScreen("intro");
  }
  function erase() {
    if (deleteSave()) {
      g.clear();
      setScreen("menu");
      setConfirm(null);
    } else {
      setNotice(
        "Não foi possível apagar o progresso. Verifique as permissões de armazenamento do navegador.",
      );
      setConfirm(null);
    }
  }
  const currentEnding = g.game ? ending(g.game) : null;
  return (
    <div
      className={`app ${g.settings.scanlines ? "scanlines" : ""} ${g.settings.reduced ? "reduced-motion" : ""}`}
      style={{ "--glitch": g.settings.glitch } as CSSProperties}
      onPointerDown={() => unlockAudio()}
      onKeyDown={() => unlockAudio()}
    >
      {!g.game ? (
        <div className="welcome">
          <div className="welcome-map">
            <CityMap />
          </div>
          <div className="welcome-grid" />
          <header className="welcome-header">
            <span className="municipal-seal">SA</span>
            <span>
              PREFEITURA DE SANTA AURORA
              <br />
              <small>DIVISÃO DE VIGILÂNCIA MUNICIPAL</small>
            </span>
            <span className="welcome-online">
              <i /> SISTEMA DISPONÍVEL
            </span>
          </header>
          <main className="welcome-main">
            {screen === "menu" ? (
              <>
                <div className="eyebrow amber">
                  SISTEMA DE MONITORAMENTO / ACESSO RESTRITO
                </div>
                <h1>
                  FREQUÊNCIA
                  <span>
                    13<span className="title-cross">+</span>
                  </span>
                </h1>
                <p className="welcome-description">
                  A cidade dorme.
                  <br />
                  Alguém precisa continuar ouvindo.
                </p>
                <div className="welcome-actions">
                  <button className="primary" onClick={newGame}>
                    <Icon name="power" /> NOVO TURNO <Icon name="arrow" />
                  </button>
                  <button disabled={!g.saved} onClick={g.resume}>
                    <Icon name="play" /> CONTINUAR{" "}
                    <small>
                      {g.saved
                        ? `NOITE ${String(g.saved.night).padStart(2, "0")} · ${clock(g.saved.minute)}`
                        : "SEM REGISTRO"}
                    </small>
                  </button>
                  <div>
                    <button onClick={() => setScreen("settings")}>
                      <Icon name="system" size={16} /> CONFIGURAÇÕES
                    </button>
                    <button onClick={() => setScreen("credits")}>
                      CRÉDITOS ↗
                    </button>
                  </div>
                </div>
                <div className="welcome-protocol">
                  <span>PROTOCOLO 013</span>
                  <p>Atenda. Observe. Não abandone seu posto.</p>
                </div>
              </>
            ) : screen === "intro" ? (
              <section className="intro panel">
                <div className="eyebrow amber">
                  CREDENCIAL TEMPORÁRIA / OPERADOR 013
                </div>
                <h2>
                  Bem-vindo ao
                  <br />
                  turno da madrugada.
                </h2>
                <p>
                  Central de Monitoramento Municipal de Santa Aurora.
                  <br />
                  Você estará sozinho das <strong>00:00 às 06:00.</strong>
                </p>
                <ol>
                  <li>Atenda os chamados.</li>
                  <li>Registre e investigue as ocorrências.</li>
                  <li>Despache unidades quando necessário.</li>
                  <li>Monitore as câmeras e os recursos.</li>
                  <li>Não abandone seu posto.</li>
                </ol>
                <p className="muted">
                  O relógio avança um minuto por segundo. Pause a qualquer
                  momento. Seu progresso é salvo automaticamente neste
                  navegador.
                </p>
                <button
                  className="primary"
                  onClick={() => {
                    sound("beep", g.settings);
                    g.start();
                    setScreen("menu");
                  }}
                >
                  INICIAR TURNO <Icon name="arrow" />
                </button>
                <button onClick={() => setScreen("menu")}>VOLTAR</button>
              </section>
            ) : (
              <section className="panel welcome-options">
                <div className="eyebrow">FREQUÊNCIA 13 / SISTEMA</div>
                <h2>{screen === "settings" ? "Configurações" : "Créditos"}</h2>
                {screen === "settings" ? (
                  <>
                    <Settings settings={g.settings} change={g.setSettings} />
                    <SaveBackup saved={g.saved} onImport={g.importSave} />
                    {g.saved && (
                      <button
                        className="danger-button"
                        onClick={() => setConfirm("erase")}
                      >
                        APAGAR PROGRESSO
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      Um jogo de suspense, investigação e gerenciamento em sete
                      noites.
                    </p>
                    <p>
                      Conceito e direção: briefing do projeto FREQUÊNCIA 13.
                      <br />
                      Implementação, narrativa e arte procedural: desenvolvidas
                      neste projeto com assistência do Codex.
                    </p>
                    <p>
                      Todos os locais, pessoas e acontecimentos são fictícios.
                      Cenas vetoriais e sons sintetizados localmente, sem mídias
                      externas.
                    </p>
                    <p className="muted">
                      Versão 1.0 · React / TypeScript / Web Audio
                    </p>
                  </>
                )}
                <button onClick={() => setScreen("menu")}>
                  ← VOLTAR AO MENU
                </button>
              </section>
            )}
          </main>
          <div className="welcome-side-note">
            <span>156.130</span>
            <small>MHz / CANAL RESERVADO</small>
            <div className="frequency-line">▁ ▂ ▁ ▁ ▃ ▆ ▂ █ ▃ ▁ ▂ ▁ ▅ ▁</div>
            <p>
              ÚLTIMA TRANSMISSÃO
              <br />
              <b>“Central, está na escuta?”</b>
            </p>
          </div>
          <footer className="welcome-footer">
            <span>
              SA-OS v3.13 <i /> TERMINAL 013
            </span>
            <span>
              00:00 — 06:00 <b>•</b> SETE NOITES. UMA FREQUÊNCIA.
            </span>
            <span>FONES DE OUVIDO RECOMENDADOS</span>
          </footer>
        </div>
      ) : g.game.phase === "playing" ? (
        <Dashboard
          game={g.game}
          dispatch={g.dispatch}
          settings={g.settings}
          changeSettings={g.setSettings}
          menu={g.menu}
          erase={() => {
            g.dispatch({ type: "PAUSE" });
            setConfirm("erase");
          }}
          storageError={g.storageError}
        />
      ) : (
        <div className="end-screen">
          <div className="end-grid" />
          <main className="end-content">
            <div
              className={`eyebrow ${g.game.phase === "lost" ? "red" : "amber"}`}
            >
              {g.game.phase === "lost"
                ? "CONEXÃO INTERROMPIDA"
                : g.game.phase === "complete"
                  ? "FIM DA CAMPANHA"
                  : "REGISTRO DO PLANTÃO"}
            </div>
            <div className="end-time">{clock(g.game.minute)}</div>
            <h1>
              {g.game.phase === "lost"
                ? g.game.failure
                : g.game.phase === "complete"
                  ? currentEnding?.title
                  : "Turno encerrado"}
            </h1>
            <p>
              {g.game.phase === "complete"
                ? currentEnding?.text
                : g.game.phase === "lost"
                  ? "O registro termina aqui. Ninguém confirmou quem desligou o terminal."
                  : `O plantão diurno assumiu a central. Você sobreviveu à noite ${g.game.night}: ${nightTitles[g.game.night - 1].toLowerCase()}.`}
            </p>
            <div className="end-stats">
              <div>
                <span>NOITE</span>
                <strong>0{g.game.night}</strong>
              </div>
              <div>
                <span>ATENDIDAS</span>
                <strong>{g.game.resolved}</strong>
              </div>
              <div>
                <span>IGNORADAS</span>
                <strong>{g.game.ignored}</strong>
              </div>
              <div>
                <span>EQUIPES PERDIDAS</span>
                <strong>
                  {
                    g.game.units.filter(
                      (u) =>
                        u.status === "indisponível" ||
                        u.status === "sem comunicação",
                    ).length
                  }
                </strong>
              </div>
            </div>
            <div className="end-decisions">
              <span className="eyebrow">DECISÕES DO TURNO</span>
              {g.game.decisions
                .filter((d) => d.startsWith(`N${g.game!.night} `))
                .slice(-7)
                .map((d, i) => (
                  <p key={i}>{d.substring(5)}</p>
                ))}
              {!g.game.decisions.some((d) =>
                d.startsWith(`N${g.game!.night} `),
              ) && <p>Nenhuma decisão registrada.</p>}
            </div>
            {g.game.phase === "won" && (
              <button
                className="primary"
                onClick={() => g.dispatch({ type: "NEXT" })}
              >
                INICIAR NOITE {g.game.night + 1} <Icon name="arrow" />
              </button>
            )}
            {g.game.phase === "lost" && (
              <button className="primary" onClick={g.retry}>
                TENTAR NOVAMENTE · INÍCIO DESTA NOITE
              </button>
            )}
            <button onClick={g.menu}>MENU PRINCIPAL</button>
            <small className="save-caption">
              {g.storageError
                ? "Não foi possível salvar. Verifique o armazenamento."
                : "Progresso salvo automaticamente."}
            </small>
          </main>
        </div>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <div className="eyebrow amber">CONFIRMAÇÃO NECESSÁRIA</div>
            <h2 id="confirm-title">
              {confirm === "new"
                ? "Iniciar uma nova campanha?"
                : "Apagar o progresso?"}
            </h2>
            <p>
              {confirm === "new"
                ? "O registro atual será substituído quando você iniciar o novo turno."
                : "A campanha, as decisões e os documentos encontrados serão apagados. Esta ação não pode ser desfeita."}
            </p>
            <button
              className="danger-button"
              onClick={() => {
                if (confirm === "erase") erase();
                else {
                  setConfirm(null);
                  setScreen("intro");
                }
              }}
            >
              {confirm === "new"
                ? "INICIAR NOVA CAMPANHA"
                : "SIM, APAGAR PROGRESSO"}
            </button>
            <button autoFocus onClick={() => setConfirm(null)}>
              CANCELAR
            </button>
          </section>
        </div>
      )}
      {notice && (
        <div className="notice fixed" role="alert">
          {notice}
          <button onClick={() => setNotice("")}>FECHAR</button>
        </div>
      )}
    </div>
  );
}
