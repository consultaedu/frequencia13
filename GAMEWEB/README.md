# FREQUÊNCIA 13

Jogo de suspense e gerenciamento ambientado na central de monitoramento de **Santa Aurora**. Uma campanha tem sete noites, das 00:00 às 06:00. Todo o conteúdo está em português brasileiro.

## Desenvolvimento

Requer Node.js **22.12+** e npm. A versão recomendada para produção é **Node.js 24**, declarada em `.node-version`.

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Nenhum endereço de desenvolvimento é fixado no código da aplicação.

## Build

```sh
npm run build
```

O build gera **`dist/index.html`**, JavaScript/CSS em **`dist/assets/`**, o favicon e as regras de headers. `dist/` não deve ser enviado ao GitHub: a Cloudflare executa o build.

## Preview

```sh
npm run preview
```

Abra o endereço informado pelo comando. Execute o build antes de iniciar o preview.

## Deploy

Hospedagem: **Cloudflare Pages**, com integração GitHub.

| Campo                  | Valor                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Framework preset       | Vite (React/Vite, se esse for o nome exibido)                                                       |
| Build command          | `npm run build`                                                                                     |
| Build output directory | `dist`                                                                                              |
| Root directory         | `GAMEWEB` no repositório pai atual; deixe vazio se esta pasta for a raiz de um repositório dedicado |
| Production branch      | `main`, após o commit e push aprovados                                                              |
| Node.js                | `24` (arquivo `.node-version`; opcionalmente `NODE_VERSION=24` no painel)                           |
| Secrets/bindings       | Nenhum                                                                                              |

1. Envie os arquivos deste projeto ao GitHub após revisar a lista de publicação. O repositório Git atual está na pasta pai; não inclua os outros projetos por acidente.
2. Na Cloudflare, acesse **Workers & Pages → Create application → Pages → Connect to Git** (ou **Import an existing Git repository**, conforme o painel).
3. Autorize o repositório GitHub escolhido e selecione a branch de produção.
4. Preencha os campos acima. Para a estrutura atual, use obrigatoriamente a raiz de build **`GAMEWEB`**.
5. Selecione **Save and Deploy**. Abra o endereço `pages.dev` informado ao terminar.
6. Teste o jogo nesse endereço. Não é necessário adicionar domínio personalizado nem alterar DNS.

O projeto usa o fallback SPA nativo do Pages: **não existe `404.html` na raiz de `dist`**. Não há React Router; os painéis usam estado React. Um acesso direto a um caminho da SPA ou refresh carrega a aplicação, sem transformar esses caminhos em telas independentes. O `base: "/"` resolve os assets na raiz da origem, tanto em Pages quanto num futuro domínio próprio. Não configure uma base `/GAMEWEB/`: a raiz de build do repositório não é um prefixo da URL.

`public/_headers` é copiado ao build com proteção contra MIME sniffing, enquadramento em outros sites e uso desnecessário de câmera/microfone/geolocalização. Essas regras não desabilitam a saída de áudio Web Audio. O preview Vite não aplica `_headers`; a Cloudflare os interpreta após o deploy. O cache nativo do Pages é preservado.

Documentação oficial: [React no Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/), [fallback SPA](https://developers.cloudflare.com/pages/configuration/serving-pages/), [versão do Node](https://developers.cloudflare.com/pages/configuration/build-image/) e [integração Git](https://developers.cloudflare.com/pages/get-started/git-integration/).

## Progresso e troca de endereço

As chaves **`frequencia13.save.v1`** e **`frequencia13.settings.v1`** permanecem inalteradas. Atualizações no mesmo endereço preservam o save. Não há migração automática, limpeza de storage, backend ou autenticação.

O navegador isola o localStorage por **origem** (protocolo, host e porta). Por isso o site publicado não pode ler automaticamente um save do ambiente local; a mesma separação acontece entre `pages.dev` e um domínio próprio. O save original continua no endereço anterior.

Para transferir a campanha: no **menu principal → Configurações → Backup do progresso**, escolha **Exportar progresso**; no novo endereço, escolha **Importar progresso**, selecione o JSON e confirme. Volte ao menu e use **Continuar**. A importação valida o arquivo antes de substituir qualquer progresso. As preferências de áudio e interface continuam separadas por navegador/origem.

Após instalar as dependências, o jogo não usa fontes, imagens, serviços ou arquivos de áudio externos. O mapa e as câmeras são SVG/CSS; os sons são sintetizados após interação do jogador. Todos os recursos de execução estão no projeto.

## Jogar

- Comece um **Novo turno** e leia a introdução. A primeira ligação chega às 00:03.
- Abra **Chamadas**, escolha uma unidade livre e uma resposta. Há 50 minutos de jogo para atender cada ligação; ignorar e orientar moradores têm consequências diferentes.
- **Mapa** mostra ocorrências clicáveis, câmeras e equipes. **Equipes** mostra deslocamento, permanência no local e retorno. Despachar exige rádio ligado, sinal e energia.
- **Câmeras** permite alternar entre oito cenas. Observe mudanças discretas entre visitas.
- **Rádio** guarda as transmissões. Equipes sem comunicação podem ser recuperadas em **Equipes**, antes que se tornem indisponíveis.
- Em **Sistema**, desligue setores, use as duas cargas do gerador e restaure o enlace. Apagar as luzes economiza energia, mas aumenta o risco. Noites posteriores têm quedas de tensão.
- **Arquivos** contém pistas para comandos adicionais do **Terminal**. Os comandos públicos aparecem com `help`.
- O botão de pausa suspende a simulação. Trocar para outra aba também pausa automaticamente. O menu principal interrompe o turno; **Continuar** retoma o estado salvo.
- O objetivo imediato é chegar às 06:00 com a central operacional. Ao fim do turno, consulte o resumo e inicie a próxima noite. Ao perder, **Tentar novamente** restaura o início daquela noite, com o progresso narrativo anterior.
- As decisões e a investigação determinam qual dos dois epílogos aparece após a sétima noite.

Em velocidade normal, cada noite dura seis minutos reais, sem contar pausas. As configurações permitem 0,5×, 1×, 2× e 4×. O relógio não usa o horário do computador.

## Arquitetura

```text
src/
  App.tsx                   menu, introdução, confirmação e resultados
  components/               central, mapa SVG, câmeras, chamadas e painéis
  data/world.ts             cidade, locais, câmeras e documentos
  events/catalog.ts         28 eventos definidos por dados
  game/
    GameState.ts            reducer e regras da simulação
    GameClock.ts            duração do turno e constante de velocidade
    EventSystem.ts          elegibilidade, raridades e seleção determinística
    DispatchSystem.ts       transições das equipes e mensagens
    CameraSystem.ts         estados e anomalias das câmeras
    StoryFlags.ts           condições dos epílogos
    SaveSystem.ts           validação, versão do save e localStorage
    AudioSystem.ts          sintetizador Web Audio com ativação por interação
    types.ts                tipos de estado, ações, eventos e consequências
    game.test.ts            testes de regras e simulação de campanhas
  hooks/useGame.ts           timer, pausa por visibilidade e autosave
  utils/random.ts            gerador com seed
  styles/global.css         interface, CRT e layouts responsivos
scripts/browser-check.mjs   verificação opcional em navegador real
```

O reducer não lê o relógio real, DOM ou armazenamento. Eventos, decisões, falhas, viagens e transições são processados em passos de um minuto. A seed e o estado interno do RNG são salvos, mantendo a continuidade da sequência após recarregar. Cada turno guarda um checkpoint independente, sem snapshots recursivos.

O catálogo contém 19 ocorrências procedurais (10 comuns, 5 incomuns, 3 raras, 1 muito rara), a primeira ligação, o evento da central e sete episódios narrativos. Os eventos têm janela de tempo, local, raridade, escolhas e consequências; requisitos opcionais suportam flags, energia, unidade disponível e eventos já vistos. As flags podem habilitar ocorrências posteriores.

## Validação

Os testes automatizados cobrem relógio e pausa, determinismo da seed, catálogo, consequências, expiração, despacho e retorno, recuperação de equipes, energia, câmeras, finais, sete noites em quatro seeds, checkpoint e save/load, incluindo armazenamento bloqueado e dados inválidos.

Não há lint configurado. O TypeScript usa modo estrito e verifica imports e variáveis sem uso.

Comandos de validação:

```sh
npm test
npm run typecheck
npm run build
npm run check:dist
npx playwright install chromium
npm run test:browser
```

Playwright faz parte das dependências de desenvolvimento. A instalação do navegador só é necessária para testes, não para executar o jogo ou publicar no Pages. O teste inicia e encerra automaticamente um preview de `dist` numa porta disponível; `TEST_URL` pode apontar para um preview já iniciado. `BROWSER_CHANNEL=chrome` permite usar o Chrome instalado em vez do Chromium do Playwright.

As capturas e o relatório são escritos em `.verification/`, ignorada pelo Git. O script valida o fluxo inicial, painéis, chamadas, despacho, pausa, recarga e save, fim de turno, derrota, retry, refresh de caminho profundo, assets, ativação de Web Audio e transferência de backup entre origens. Também verifica resoluções de 390 a 2560 pixels. Fim de turno e derrota usam saves de teste próximos da transição; as campanhas completas são simuladas pelos testes de regras. A validação de áudio verifica os nós sintetizados e o contexto ativo, não uma avaliação auditiva humana.

## Arquivos para GitHub

Inclua `src/`, `public/`, `scripts/`, `docs/`, `index.html`, `package.json`, **`package-lock.json`**, `vite.config.ts`, `tsconfig.json`, `.node-version`, `.gitignore`, `.gitattributes` e este README. A lista exata está em `docs/arquivos-github.txt`.

Não envie `node_modules/`, `dist/`, logs, capturas de teste, backups de saves, `.env` com segredos ou arquivos pessoais de IDE. O jogo não exige variáveis secretas. O Git da pasta pai e o remoto existente foram preservados; não foi criado um repositório Git dentro desta pasta.

## Escopo desta versão

- Sete noites completas, com noites 4–7 mais curtas em conteúdo narrativo e ocorrências procedurais compartilhadas.
- Arte vetorial/CSS e sons sintetizados; sem vídeos, dublagem, backend, multiplayer ou sincronização de saves.
- Interface prioritária para desktop, adaptada para tablet e celular. Suporte a teclado, foco visível e redução de movimento; não há atalho de teclado para todas as operações.
- O armazenamento é local e versionado. Apagar os dados do navegador remove o progresso. Falhas de armazenamento são exibidas na interface.
- A primeira noite é tolerante, mas chamadas abandonadas acumulam risco. A investigação do final alternativo exige leitura e decisões; não é necessário resolver todos os segredos para sobreviver.
