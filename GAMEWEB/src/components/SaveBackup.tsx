import { useEffect, useRef, useState } from "react";
import { deserialize, serialize, saveGame } from "../game/SaveSystem";
import type { GameState } from "../game/types";

export default function SaveBackup({
  saved,
  onImport,
}: {
  saved: GameState | null;
  onImport: (game: GameState) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const downloadUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
    },
    [],
  );
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<GameState | null>(null);
  function restore() {
    if (!pending) return;
    if (!saveGame(pending)) {
      setMessage(
        "Não foi possível salvar. Verifique o armazenamento do navegador.",
      );
      return;
    }
    onImport(pending);
    setPending(null);
    setMessage("Progresso importado. Volte ao menu e escolha CONTINUAR.");
  }
  return (
    <section className="save-backup">
      <h3>Backup do progresso</h3>
      <p>
        Para trocar de endereço ou navegador, exporte aqui e importe o arquivo
        no novo site. O save atual continua automático.
      </p>
      <button
        disabled={!saved}
        onClick={() => {
          if (!saved) return;
          if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
          const url = URL.createObjectURL(
            new Blob([serialize(saved)], { type: "application/json" }),
          );
          downloadUrl.current = url;
          const link = document.createElement("a");
          link.href = url;
          link.download = `frequencia13-save-${saved.seed}.json`;
          document.body.append(link);
          link.click();
          link.remove();
          setMessage(
            "Backup exportado. Guarde o arquivo para importar no novo endereço.",
          );
        }}
      >
        EXPORTAR PROGRESSO
      </button>
      <button onClick={() => input.current?.click()}>IMPORTAR PROGRESSO</button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        aria-label="Arquivo de progresso"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          setPending(null);
          if (!file) return;
          if (file.size > 2_000_000) {
            setMessage(
              "Arquivo muito grande. Selecione um backup de até 2 MB.",
            );
            return;
          }
          try {
            const game = deserialize(await file.text());
            if (!game || (game.checkpoint && !deserialize(game.checkpoint))) {
              setMessage(
                "Backup inválido ou incompatível. Seu progresso foi preservado.",
              );
              return;
            }
            setPending(game);
            setMessage("");
          } catch {
            setMessage(
              "Não foi possível ler o arquivo. Seu progresso foi preservado.",
            );
          }
        }}
      />
      {pending && (
        <div role="group" aria-label="Confirmar importação">
          <p>
            Noite {pending.night} · seed {pending.seed}.{" "}
            {saved
              ? "A importação substituirá seu progresso atual."
              : "Importar este progresso?"}
          </p>
          <button onClick={restore}>CONFIRMAR IMPORTAÇÃO</button>
          <button onClick={() => setPending(null)}>CANCELAR IMPORTAÇÃO</button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
