# Preparação para publicação — FREQUÊNCIA 13

Validação local realizada em 01/10/2026. Nenhum deploy, commit, push, alteração de remoto, domínio ou DNS foi executado nesta etapa.

## Alterações

- Configuração explícita do Vite para SPA na raiz da origem, build em `dist` e sem source maps públicos.
- Node mínimo 22.12 declarado no pacote; Node 24 recomendado para Pages via `.node-version`.
- Arquivos temporários, dependências, builds, credenciais locais e backups excluídos do Git; lockfile mantido.
- Headers de proteção preparados como arquivo estático do Pages.
- Teste de navegador passou a usar Playwright instalado no próprio projeto e a iniciar preview em porta disponível, sem caminhos da máquina ou servidor fixo.
- Inspeção automatizada de HTML, assets, favicon, headers e condição do fallback SPA nativo.
- Exportação/importação de campanha nas configurações do menu, com validação e confirmação antes de substituir o save. Schema e chaves de localStorage preservados.

## Arquivos criados nesta etapa

- `.gitattributes`
- `.node-version`
- `public/_headers`
- `scripts/check-dist.mjs`
- `src/components/SaveBackup.tsx`
- `docs/PUBLICACAO.md`
- `docs/arquivos-github.txt`

## Arquivos modificados nesta etapa

- `.gitignore`
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `README.md`
- `scripts/browser-check.mjs`
- `src/App.tsx`
- `src/hooks/useGame.ts`
- `src/game/SaveSystem.ts`
- `src/game/game.test.ts`
- `src/styles/global.css`

Nenhum arquivo do jogo foi removido. A lógica de eventos, tempo, despacho, narrativa e áudio foi preservada. `dist/` e `.verification/` foram regenerados e permanecem ignorados.

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm install` | Concluído; auditoria informou zero vulnerabilidades |
| `npm test` | 25 testes aprovados |
| `npm run typecheck` | Aprovado |
| `npm run build` | Aprovado; 49 módulos processados |
| `npm run check:dist` | Aprovado; HTML, JS, CSS, favicon e `_headers` presentes |
| `npm run test:browser` | 21 verificações aprovadas sobre preview de produção |
| Console do navegador | Zero erros e zero warnings |
| Responsividade | 390, 768, 1366, 1920 e 2560 pixels, sem overflow horizontal |
| Lint | Não existe configuração/script de lint; TypeScript estrito executado |
| Segredos no projeto | Nenhum encontrado na revisão e busca por padrões de credenciais; nenhum `.env` presente |

O fluxo no navegador cobriu tela inicial, novo jogo, chamada e despacho, mapa, equipes, câmeras, rádio, terminal, arquivos, tempo, pausa, save, continuar após recarga, conclusão da noite, derrota, retry, refresh de caminho profundo e transferência de backup entre origens. O áudio foi validado pela criação e execução de nós Web Audio após interação e por contexto em estado `running`; não houve avaliação auditiva humana. A conclusão da noite no navegador utiliza um save às 05:59, enquanto os testes de simulação percorrem as sete noites completas.

O verificador estático inicialmente confundiu URLs normais incluídas pelo React com caminhos de disco. A expressão foi corrigida; não foi encontrado caminho local no bundle final.

**Warning da instalação:** o npm usado neste ambiente informou que a política local `allowScripts` bloqueou o postinstall do esbuild. Os binários necessários estavam disponíveis e o build passou. Nenhuma política de execução global foi alterada. O build e o navegador não emitiram warnings.

## GitHub e escopo do Git

O Git existente pertence à pasta pai `Projetos`, contém um remoto `origin`, está na branch `main` e não possui commits locais. `GAMEWEB` estava inteiramente não rastreada, assim como outras pastas irmãs. Esse estado foi preservado; não foi criado Git aninhado, commit inicial, force push ou alteração no histórico.

`docs/arquivos-github.txt` lista exatamente os arquivos desta pasta que podem ser incluídos no commit. Não se deve incluir as pastas irmãs nessa publicação. A lista inclui fontes, recursos estáticos, testes, documentação e lockfile; exclui dependências, build, relatórios locais e backups. Nenhuma credencial ou informação pessoal foi encontrada nesses arquivos; pessoas e contatos da narrativa são fictícios.

## Configuração do Pages

| Campo | Valor |
| --- | --- |
| Serviço | Cloudflare Pages, integração GitHub |
| Framework | Vite / React + Vite |
| Branch de produção | `main`, depois de existir no GitHub |
| Root directory | `GAMEWEB` para o repositório pai atual |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | `24` |
| Variáveis secretas / bindings | Nenhum |

Se um repositório dedicado tiver `package.json` na raiz, deixe Root directory vazio. Os assets continuam na raiz da URL, independentemente da subpasta do repositório.

No painel: **Workers & Pages → Create application → Pages → conectar/importar Git → selecionar repositório e branch → preencher os campos → Save and Deploy**. Use inicialmente o endereço `pages.dev`. Não configure domínio personalizado nem DNS nesta etapa.

O fallback SPA é o comportamento nativo do Pages quando não existe `404.html` na raiz; essa condição é verificada no build. Não há rotas React Router. O preview Vite foi testado, mas os headers e o comportamento real da infraestrutura Cloudflare só poderão ser confirmados depois que o usuário autorizar/publicar o site. O projeto permanece inteiramente client-side, sem Functions, Workers, banco de dados ou autenticação.

Saves existentes continuam no mesmo navegador/origem. Para mudar do endereço local para Pages, ou de Pages para um domínio próprio, exporte o progresso no endereço anterior e importe no novo. Isso contorna a separação obrigatória de localStorage por origem sem alterar o sistema de saves.
