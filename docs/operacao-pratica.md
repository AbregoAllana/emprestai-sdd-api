# Operação da prática

## Preparação local

Use Node 24, Windows PowerShell para as fotos e PostgreSQL 16 descartável. Após npm ci na API e no frontend, rode npm run prisma:generate na API. Para o teste em PostgreSQL puro, aplique tests/bootstrap.sql no banco emprestai_sdd antes do Prisma. Esse SQL é uma infraestrutura de teste e não é aplicado no Supabase. DATABASE_URL, DIRECT_URL e PRACTICE_TEST_DATABASE_URL apontam para o mesmo banco localhost. Rode npm run prisma:migrate e npm test na API. No frontend, rode npm run api:generate, npm run build, npm run lint e npm test. Confira se o contrato OpenAPI dos dois repositórios é idêntico.

## Verificador

No backend, execute npm run spec:close -- 002 ../emprestAI_frontend REF_API REF_WEB RELATORIO.json EVIDENCIA.json. Troque 002 por 003 para revisar empréstimos. Para revisar a entrada pública, use 004 com o mesmo formato de comando. As specs 002 e 003 usam PostgreSQL descartável já inicializado. A 004 usa apenas os checks do frontend e a spec no repositório web. Use Codex CLI autenticado. O fechamento inicia um processo Codex separado e efêmero com o papel do verificador do projeto. A sessão recebe apenas o pacote de evidências, sem shell, apps ou conectores. A evidência humana é um array JSON de objetos com id (por exemplo CA-01) e evidence (URL pública, observação e resultado sanitizado). Inclua uma entrada por critério. Sem o arquivo completo, o fechamento fica reprovado mesmo que os checks locais passem. Não forneça credenciais nem tokens. Registre o relatório mesmo quando o status for NÃO PRONTA.

## Tag final

Na primeira preparação de um par de clones, rode npm run release:practice -- install ../emprestAI_frontend na API. Isso instala os hooks de criação e envio da tag nos dois clones. O comando de release também instala a proteção automaticamente.

Após publicar e conferir os dois HEADs, coloque as evidências humanas em uma pasta local com os arquivos 002.json, 003.json e 004.json. Na API, rode npm run release:practice -- release ../emprestAI_frontend PASTA_DE_EVIDENCIAS. O comando executa o verificador das três specs para o mesmo par de commits e só cria as duas tags anotadas se os três pareceres autorizarem a entrega. Os hooks recusam a criação e o push de uma tag que não corresponda à autorização local. A anotação registra o par de commits e os hashes SHA-256 dos pareceres. Quando a publicação dos dois commits e os pareceres das três specs estiverem conferidos, a titular libera temporariamente apenas a criação da tag nas regras GitHub 26880090 (API) e 26880092 (frontend). Com as duas tags anotadas já criadas pelo fluxo local, a titular faz git push origin entrega-pratica em cada repositório e reativa a restrição de criação. As restrições de alteração e exclusão ficam ativas durante todo o envio.

A proteção local vale para clones com os hooks instalados. No GitHub, a regra ativa bloqueia criação, alteração e exclusão da tag exata. O GitHub não interpreta os pareceres. A titular controla a abertura da criação depois de conferir os relatórios do fluxo local.

## Publicação executada pela titular

1. Crie um projeto Supabase próprio da prática com Auth por e-mail/senha, cadastro público desativado e chave de assinatura assimétrica. Crie dois projetos Vercel vinculados aos repositórios da prática. Configure a API com a origem exata do frontend e as variáveis de runtime da seção inicial de .env.example. As variáveis da skill e da carga pertencem à sessão local da titular. Use a conexão de runtime com pooler transacional e a conexão direta para a migração. No frontend use a URL da API, a URL do Supabase e sua chave pública.
2. Na spec 002, execute Search, Prepare e Verify da skill com sua chave Pixabay. Revise as imagens e preencha as aprovações. Crie o bucket público equipment-images. Faça upload dos 12 arquivos nos caminhos equipment/TI-0001.jpg a equipment/TI-0012.jpg, mantendo o mesmo caminho ao repetir.
3. No Supabase Auth, crie ou localize marcelo.grilo@institutojef.org.br e configure a senha padrão da turma por sessão própria. Anote o UUID Auth para a carga. Em terminal da titular, aplique npm run prisma:migrate usando conexão direta; para npm run prisma:seed, aponte DATABASE_URL para a conexão direta e informe PRACTICE_TEACHER_USER_ID e PRACTICE_PHOTO_MANIFEST. A carga valida o e-mail do UUID no Auth e bloqueia se houver empréstimos anteriores ou equipamento fora da lista no tenant. Se houver bloqueio, revise a conta ou o inventário antes de repetir. Repita a carga para validar idempotência. Confira as URLs públicas, o login e zero empréstimos do professor.
4. Promova a versão 003 após a validação local. Execute a [conferência no link de produção](#07--conferência-no-link-de-produção).
5. Complete a evidência humana e use o comando de release acima para fechar as specs e marcar os dois commits publicados.

## 07 — Conferência no link de produção

Anote as URLs de produção, os SHAs completos que a Vercel mostra para API e frontend e a data da conferência. Abra o frontend em uma janela sem sessão e confirme que a API responde em `/v1/health/ready`.

Prepare uma conta sua de teste no Supabase Auth. No Table Editor, vincule o UUID dessa conta em `public.memberships` com `role = COLLABORATOR` e com o `tenant_id` da linha de slug `suporte_ti` em `public.tenants`. Use uma conta sem empréstimos abertos e mantenha as sessões de teste e do professor separadas.

- [ ] **Login do professor.** No link da Vercel, entre como `marcelo.grilo@institutojef.org.br` com a senha padrão da turma. Confirme que o catálogo abre e que **Meus empréstimos** está vazio. Saia dessa sessão sem solicitar nenhum equipamento. (002/CA-03)
- [ ] **Inventário e fotos.** Com a conta de teste, confira os 12 patrimônios da lista canônica, nove disponíveis e três em manutenção. Veja se as 12 fotos carregam e têm a mesma dimensão nos cards para a mesma largura de tela. Abra também as 12 URLs sem sessão e confira os JPEGs de 800 × 600 e o crédito **Fotos: Pixabay** no catálogo. (002/CA-01, 002/CA-02, 003/CA-01)
- [ ] **Manutenção.** Confira que `TI-0004`, `TI-0007` e `TI-0010` exibem a situação de manutenção e não oferecem uma ação de solicitação habilitada. (003/CA-03)
- [ ] **Solicitação e data.** Solicite um equipamento disponível. Confira a data efetiva no diálogo e veja se o equipamento aparece em **Meus empréstimos** com a mesma data prevista, 14 dias corridos após a solicitação. (003/CA-02, 003/CA-05)
- [ ] **Disponibilidade após confirmar.** Confira que o equipamento solicitado deixou de aparecer como disponível no catálogo, inclusive depois de recarregar a página. (003/CA-02)
- [ ] **Limite.** Com a mesma conta, solicite mais dois equipamentos disponíveis. Tente um quarto que ainda esteja disponível. Confira a mensagem **Limite de 3 empréstimos em aberto atingido** e verifique que a conta ficou com três empréstimos abertos. (003/CA-03)
- [ ] **Limpeza e conferência final.** A titular encerra somente os empréstimos criados nesta rodada usando `POST /v1/loans/{loanId}/return` com a sessão da conta de teste. Os IDs vêm de `GET /v1/loans/mine` dessa mesma sessão. Confira que a lista de teste voltou a ficar vazia e que os itens foram liberados. Entre novamente com a conta do professor e confirme zero empréstimos. (002/CA-03, 003/CA-05)

Guarde o resultado observado por item, com URLs públicas e capturas sanitizadas quando úteis. Para os arquivos de evidência usados no fechamento, use uma entrada por CA da spec e associe as checagens locais aos critérios que o smoke não exercita, como concorrência, atraso e isolamento. Confirme também a entrada pública da spec 004 no mesmo deploy. Se algum item falhar, registre o erro, aplique a correção e repita a conferência no par de commits que será entregue.

Se funcionar localmente e falhar na Vercel, compare os nomes e o ambiente das variáveis com os dois `.env.example` e a [regra de segredos](rules/secrets.md). Na API, confira a origem exata do frontend e a configuração do Supabase. No frontend, confira `VITE_API_URL`, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Depois de corrigir uma variável, gere um novo deploy no projeto afetado antes de repetir o teste.
