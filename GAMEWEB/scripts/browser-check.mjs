import { chromium } from "playwright";
import { preview } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
// Without TEST_URL, serve dist on an available port. Never depend on a fixed host.
const server = process.env.TEST_URL
  ? null
  : await preview({ preview: { port: 0, open: false } });
const url = process.env.TEST_URL || server?.resolvedUrls.local[0];
assert.ok(url, "O preview não informou um endereço acessível");
let browser;
let migrationServer;
try {
  browser = await chromium.launch({
    channel: process.env.BROWSER_CHANNEL || undefined,
    headless: true,
  });
} catch (error) {
  await server?.close();
  throw error;
}
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("response", (response) => {
  if (response.status() >= 400)
    console.log(`HTTP ${response.status()} ${response.url()}`);
});
await mkdir(".verification", { recursive: true });
const warnings = [];
page.on("console", (message) => {
  if (message.type() === "warning") warnings.push(message.text());
});
await page.addInitScript(() => {
  window.__audioStarts = 0;
  window.__audioContexts = [];
  const OriginalAudioContext = window.AudioContext;
  window.AudioContext = class extends OriginalAudioContext {
    constructor(...args) {
      super(...args);
      window.__audioContexts.push(this);
    }
  };
  for (const Constructor of [OscillatorNode, AudioBufferSourceNode]) {
    const start = Constructor.prototype.start;
    Constructor.prototype.start = function (...args) {
      window.__audioStarts++;
      return start.apply(this, args);
    };
  }
});
const checks = [];
const check = (name) => {
  checks.push(name);
  console.log(`PASS ${name}`);
};
try {
  await page.goto(url);
  await page.getByRole("button", { name: "NOVO TURNO" }).waitFor();
  assert.equal(await page.evaluate(() => window.__audioStarts), 0);
  assert.equal(
    await page
      .locator(".welcome")
      .evaluate((el) => getComputedStyle(el).position),
    "relative",
  );
  const favicon = await page.request.get(new URL("/favicon.svg", url).href);
  assert.equal(favicon.status(), 200);
  assert.match(favicon.headers()["content-type"], /image\/svg\+xml/);
  assert.ok(await page.locator(".map-drawing").isVisible());
  check("CSS, favicon e mapa SVG carregados sem recursos externos");
  assert.equal(
    await page.getByRole("button", { name: /CONTINUAR/ }).isDisabled(),
    true,
  );
  await page.screenshot({ path: ".verification/01-menu.png", fullPage: true });
  check("Tela inicial e continuar desabilitado sem save");
  await page.getByRole("button", { name: "NOVO TURNO" }).click();
  await page
    .getByRole("button", { name: "INICIAR TURNO", exact: true })
    .click();
  await page
    .getByRole("heading", { name: /Monitoramento da cidade/ })
    .waitFor();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("frequencia13.save.v1")).minute >= 3,
  );
  await page.screenshot({
    path: ".verification/02-central.png",
    fullPage: true,
  });
  check("Introdução, relógio e chegada da primeira chamada");
  assert.ok(
    await page.evaluate(
      () =>
        window.__audioStarts > 0 &&
        window.__audioContexts.some((context) => context.state === "running"),
    ),
  );
  check("Web Audio ativado após interação e sons sintetizados");
  await page.getByRole("button", { name: /ATENDER/ }).click();
  await page.getByRole("heading", { name: "A primeira ligação" }).waitFor();
  await page.screenshot({
    path: ".verification/03-chamada.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Enviar equipe/ }).click();
  await page.waitForFunction(
    () =>
      JSON.parse(localStorage.getItem("frequencia13.save.v1")).units[0]
        .status === "deslocando",
  );
  check("Atendimento e despacho de unidade");
  await page.getByRole("button", { name: /^Câmeras/ }).click();
  await page.getByRole("button", { name: /CAM 03/ }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("frequencia13.save.v1")).camera === 2,
  );
  await page.screenshot({
    path: ".verification/04-cameras.png",
    fullPage: true,
  });
  check("Seleção de câmeras");
  await page.getByRole("button", { name: /^Rádio/ }).click();
  assert.ok(await page.getByText("REGISTRO DE TRANSMISSÕES").isVisible());
  check("Rádio e logs");
  await page.getByRole("button", { name: /^Equipes/ }).click();
  assert.equal(await page.locator(".unit-card").count(), 3);
  check("Painel de equipes");
  await page.getByRole("button", { name: /^Arquivos/ }).click();
  assert.ok(await page.locator(".document pre").isVisible());
  check("Leitura de documentos");
  await page.getByRole("button", { name: /^Terminal/ }).click();
  for (const command of [
    "help",
    "status",
    "time",
    "units",
    "cameras",
    "power",
    "logs",
    "unknown",
  ]) {
    await page.getByLabel("Comando do terminal").fill(command);
    await page.getByRole("button", { name: /EXECUTAR/ }).click();
  }
  assert.ok(
    await page.getByText("Comando não reconhecido: unknown").isVisible(),
  );
  await page.getByLabel("Comando do terminal").fill("clear");
  await page.getByRole("button", { name: /EXECUTAR/ }).click();
  assert.equal(await page.locator(".terminal-history pre").count(), 0);
  check("Comandos públicos, erro desconhecido e clear");
  await page.getByRole("button", { name: /^Sistema/ }).click();
  await page.getByRole("button", { name: /Circuito de câmeras/ }).click();
  await page.getByRole("button", { name: /^Câmeras/ }).click();
  assert.ok(await page.locator(".no-signal").isVisible());
  check("Gerenciamento de energia e câmera sem sinal");
  await page.getByRole("button", { name: "Pausar turno" }).click();
  const paused = await page.evaluate(
    () => JSON.parse(localStorage.getItem("frequencia13.save.v1")).minute,
  );
  await page.waitForTimeout(1200);
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("frequencia13.save.v1")).minute,
    ),
    paused,
  );
  await page.getByRole("button", { name: "SALVAR E VOLTAR AO MENU" }).click();
  await page.reload();
  await page.getByRole("button", { name: /CONTINUAR/ }).click();
  assert.ok(
    await page
      .getByRole("heading", { name: /Monitoramento da cidade/ })
      .isVisible(),
  );
  check("Pausa, salvamento, recarga e continuar");
  await page.getByRole("button", { name: "Pausar turno" }).click();
  const existingSave = await page.evaluate(() =>
    localStorage.getItem("frequencia13.save.v1"),
  );
  const deepResponse = await page.goto(
    new URL("/central/monitoramento", url).href,
  );
  assert.equal(deepResponse.status(), 200);
  await page.reload();
  await page.getByRole("button", { name: /CONTINUAR/ }).waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("frequencia13.save.v1")),
    existingSave,
  );
  await page.getByRole("button", { name: /CONTINUAR/ }).click();
  check("Acesso direto e refresh em caminho profundo preservam assets e save");
  // Exercise end states through the real UI after loading valid save fixtures.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("frequencia13.save.v1"));
    s.minute = 359;
    s.incidents.forEach((i) => {
      if (i.status === "pending") i.status = "resolved";
    });
    s.power = 80;
    s.danger = 10;
    s.signal = 80;
    s.paused = false;
    localStorage.setItem("frequencia13.save.v1", JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole("button", { name: /CONTINUAR/ }).click();
  await page.getByRole("heading", { name: "Turno encerrado" }).waitFor();
  await page.screenshot({ path: ".verification/05-turno.png", fullPage: true });
  await page.getByRole("button", { name: "INICIAR NOITE 2" }).click();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem("frequencia13.save.v1")).night === 2,
  );
  check("Fim de turno e início da segunda noite");
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("frequencia13.save.v1"));
    s.power = 0.01;
    localStorage.setItem("frequencia13.save.v1", JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole("button", { name: /CONTINUAR/ }).click();
  await page
    .getByRole("heading", { name: "FALHA CRÍTICA DE ENERGIA" })
    .waitFor();
  await page.screenshot({
    path: ".verification/06-derrota.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /TENTAR NOVAMENTE/ }).click();
  await page.waitForFunction(() => {
    const s = JSON.parse(localStorage.getItem("frequencia13.save.v1"));
    return s.night === 2 && s.minute < 5 && s.power > 95;
  });
  check("Derrota e reinício do checkpoint da noite");
  for (const [width, height] of [
    [1366, 768],
    [1920, 1080],
    [2560, 1440],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    assert.equal(overflow, false, `horizontal overflow at ${width}`);
    await page.screenshot({
      path: `.verification/layout-${width}.png`,
      fullPage: true,
    });
  }
  check("Layouts 1366, 1920, 1440p, tablet e celular sem overflow horizontal");
  for (const name of [
    "Chamadas",
    "Câmeras",
    "Rádio",
    "Equipes",
    "Arquivos",
    "Terminal",
    "Sistema",
  ]) {
    await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `overflow mobile ${name}`,
    );
  }
  check("Todos os painéis acessíveis no celular");
  await page
    .getByRole("button", { name: "APAGAR PROGRESSO", exact: true })
    .click();
  await page.getByRole("button", { name: "CANCELAR" }).click();
  assert.ok(
    await page.evaluate(() => localStorage.getItem("frequencia13.save.v1")),
  );
  check("Confirmação de apagar preserva save ao cancelar");
  await page.getByRole("button", { name: "SALVAR E VOLTAR AO MENU" }).click();
  await page
    .getByRole("button", { name: "CONFIGURAÇÕES", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORTAR PROGRESSO" }).click();
  const download = await downloadPromise;
  const backupPath = ".verification/backup.json";
  await download.saveAs(backupPath);
  // A second origin simulates moving from a development address to Pages or a custom domain.
  migrationServer = await preview({ preview: { port: 0, open: false } });
  const alternate = new URL(migrationServer.resolvedUrls.local[0]);
  assert.notEqual(alternate.origin, new URL(url).origin);
  const migration = await browser.newPage();
  await migration.goto(alternate.href);
  await migration
    .getByRole("button", { name: "CONFIGURAÇÕES", exact: true })
    .click();
  await migration.getByLabel("Arquivo de progresso").setInputFiles(backupPath);
  await migration.getByRole("button", { name: "CONFIRMAR IMPORTAÇÃO" }).click();
  await migration.getByText("Progresso importado.", { exact: false }).waitFor();
  assert.equal(
    await migration.evaluate(() =>
      localStorage.getItem("frequencia13.save.v1"),
    ),
    await page.evaluate(() => localStorage.getItem("frequencia13.save.v1")),
  );
  await migration
    .getByLabel("Arquivo de progresso")
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{invalid"),
    });
  await migration
    .getByText("Backup inválido ou incompatível.", { exact: false })
    .waitFor();
  assert.ok(
    await migration.evaluate(() =>
      localStorage.getItem("frequencia13.save.v1"),
    ),
  );
  await migration
    .getByRole("button", { name: "VOLTAR AO MENU", exact: false })
    .click();
  await migration.reload();
  await migration.getByRole("button", { name: /CONTINUAR/ }).click();
  await migration
    .getByRole("heading", { name: /Monitoramento da cidade/ })
    .waitFor();
  await migration.close();
  check(
    "Exportação e importação entre origens, recarga e rejeição de backup inválido",
  );
  const blocked = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  blocked.on("pageerror", (error) => errors.push(error.message));
  await blocked.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "QuotaExceededError");
    };
  });
  await blocked.goto(url);
  await blocked.getByRole("button", { name: "NOVO TURNO" }).click();
  await blocked
    .getByRole("button", { name: "INICIAR TURNO", exact: true })
    .click();
  await blocked
    .getByRole("alert")
    .filter({ hasText: "Não foi possível salvar" })
    .waitFor();
  await blocked.getByRole("button", { name: "Pausar turno" }).click();
  await blocked
    .getByRole("button", { name: "SALVAR E VOLTAR AO MENU" })
    .click();
  assert.equal(
    await blocked.getByRole("button", { name: /CONTINUAR/ }).isDisabled(),
    true,
  );
  await blocked.close();
  check("Armazenamento bloqueado é informado e não oferece save inexistente");
  assert.deepEqual(errors, []);
  check("Console sem erros JavaScript");
  await writeFile(
    ".verification/browser-results.json",
    JSON.stringify({ checks, errors, warnings }, null, 2),
  );
} finally {
  await browser.close();
  await migrationServer?.close();
  await server?.close();
}
