# Operação da prática

## Preparação local

Use Node 24, Windows PowerShell para as fotos e PostgreSQL 16 descartável. Após npm ci na API e no frontend, rode npm run prisma:generate na API. Para o teste em PostgreSQL puro, aplique tests/bootstrap.sql no banco emprestai_sdd antes do Prisma. Esse SQL é uma infraestrutura de teste e não é aplicado no Supabase. DATABASE_URL, DIRECT_URL e PRACTICE_TEST_DATABASE_URL apontam para o mesmo banco localhost. Rode npm run prisma:migrate e npm test na API. No frontend, rode npm run api:generate, npm run build, npm run lint e npm test. Confira se o contrato OpenAPI dos dois repositórios é idêntico.

## Verificador

No backend, execute npm run spec:close -- 002 ../emprestAI_frontend REF_API REF_WEB RELATORIO.json EVIDENCIA.json. Para a segunda entrega, troque 002 por 003. Use o PostgreSQL descartável já inicializado e Codex CLI autenticado. A evidência humana é um array JSON de objetos com id (por exemplo CA-01) e evidence (URL pública, observação e resultado sanitizado). Inclua uma entrada por critério. Sem o arquivo completo, o fechamento fica reprovado mesmo que os checks locais passem. Não forneça credenciais nem tokens. Registre o relatório mesmo quando o status for NÃO PRONTA.

## Publicação executada pela titular

1. Crie um projeto Supabase próprio da prática com Auth por e-mail/senha, cadastro público desativado e chave de assinatura assimétrica. Crie dois projetos Vercel vinculados aos repositórios da prática. Configure a API com a origem exata do frontend e as variáveis em .env.example. Use a conexão de runtime com pooler transacional e a conexão direta para a migração. No frontend use a URL da API, a URL do Supabase e sua chave pública.
2. Na spec 002, execute Search, Prepare e Verify da skill com sua chave Pixabay. Revise as imagens e preencha as aprovações. Crie o bucket público equipment-images. Faça upload dos 12 arquivos nos caminhos equipment/TI-0001.jpg a equipment/TI-0012.jpg, mantendo o mesmo caminho ao repetir.
3. No Supabase Auth, crie ou localize marcelo.grilo@institutojef.org.br e configure a senha padrão da turma por sessão própria. Anote o UUID Auth para a carga. Em terminal da titular, aplique npm run prisma:migrate usando conexão direta; para npm run prisma:seed, aponte DATABASE_URL para a conexão direta e informe PRACTICE_TEACHER_USER_ID e PRACTICE_PHOTO_MANIFEST. Repita a carga para validar idempotência. Confira as URLs públicas, o login e zero empréstimos do professor.
4. Promova a versão 003 após a validação local. Faça o smoke na Vercel com outra conta vinculada como colaboradora do tenant suporte_ti. Teste disponibilidade, confirmação, prazo, Meus empréstimos e recusa do quarto. Para limpeza use a rota preexistente de devolução apenas nos IDs dos empréstimos dessa conta de teste. Confirme novamente zero empréstimos para o professor.
5. Complete a evidência humana e repita o verificador. A tag entrega-pratica é criada nos dois repositórios somente após os relatórios aprovados e a conferência dos commits publicados.
