# Pareceres independentes

## Erro plantado — 003/CA-02

O subagente recebeu apenas o CA, os commits e a saída dos testes. A [saída completa](erro-plantado.txt) registra as duas rodadas.

| Commit | Status | Evidência |
|---|---|---|
| 7e5d8ba78c2e0defa1e6da1b3005903c8f0a7ce4 | REPROVADO | Exit 1. Recebeu 15 dias em vez de 14 em dois testes do CA-02. |
| 530334deed15fe6a69e251bbbdfdff93645d2d6c | ATENDIDO LOCAL | Exit 0, 11/11 testes, incluindo os dois do CA-02. |

A demonstração está no [branch separado codex/prova-verificador](https://github.com/AbregoAllana/emprestai-sdd-api/tree/codex/prova-verificador). Veja o [commit plantado](https://github.com/AbregoAllana/emprestai-sdd-api/commit/7e5d8ba78c2e0defa1e6da1b3005903c8f0a7ce4) e a [reversão](https://github.com/AbregoAllana/emprestai-sdd-api/commit/530334deed15fe6a69e251bbbdfdff93645d2d6c).

## Revisão local das duas specs

Commits de implementação conferidos: API 5c6e1cf e frontend 6d5fa2e. Duas migrations aplicadas no PostgreSQL 16. API 11/11, frontend 5/5, builds e lint aprovados. Smoke HTTP com JWT/JWKS local confirmou 401 sem sessão, 200 no catálogo, 201 na criação, 200 nos próprios empréstimos e 409 em nova tentativa para o mesmo item.

| Spec | CA | Status local | Evidência | Pendência de produção |
|---|---|---|---|---|
| 002 | CA-01 | ATENDIDO | tests/practice-data.test.cjs:14, 12 itens, 9 disponíveis | Conferir inventário publicado |
| 002 | CA-02 | PARCIAL | tests/practice-data.test.cjs:20 e 12 JPEGs sintéticos validados em 800 × 600 | API Pixabay, revisão humana, URLs públicas |
| 002 | CA-03 | PARCIAL | tests/practice-data.test.cjs:36, UUID local, vínculo e zero empréstimos | Login do professor e contagem real |
| 002 | CA-04 | ATENDIDO | tests/practice-data.test.cjs:36, duas cargas com mesmos IDs e fotos | Reexecução da carga publicada |
| 003 | CA-01 | PARCIAL | Front src/App.test.tsx:35 e API tests/loans.test.cjs:61 | Exibir as 12 fotos reais |
| 003 | CA-02 | ATENDIDO | API tests/loans.test.cjs:8,61 e front src/App.test.tsx:49 | Smoke Vercel com conta de teste |
| 003 | CA-03 | ATENDIDO | API tests/loans.test.cjs:72,82,87 e front src/App.test.tsx:58 | Smoke Vercel com conta de teste |
| 003 | CA-04 | ATENDIDO | API tests/loans.test.cjs:92,100 com PostgreSQL | Publicação da versão verificada |
| 003 | CA-05 | ATENDIDO | API tests/loans.test.cjs:109 e front src/App.test.tsx:65 | Smoke Vercel com conta de teste |

**Veredito 002 e 003: NÃO PRONTAS para a entrega final.** As fotos, o login e a validação em produção seguem pendentes. Esta rodada foi conduzida por subagente no chat, com contexto limpo e só as evidências fornecidas.

## Revisão da entrada pública — spec 004

A rotina de fechamento revisou os commits da API e do frontend identificados no [parecer da spec 004](spec-004-local.json). Os sete testes do frontend passaram na cópia descartável. O relatório registrou SEM_EVIDENCIA nos três critérios porque o pacote não traz a conferência no navegador da Vercel. A spec segue aberta.

## Revisão local após as correções — specs 002 e 003

Par revisado: API 9a29446 e frontend 183d5ca. Os relatórios são locais e as duas rotinas devolveram NÃO PRONTA porque falta a evidência de produção.

### Spec 002

[Parecer JSON da spec 002](spec-002-revisao-local.json)

| CA | Status do verificador | Evidência | Observação |
|---|---|---|---|
| CA-01 | ATENDIDO | `prisma/equipment-practice.json` e o teste `002/CA-01 mantém lista exata e 9 disponíveis` em `tests/practice-data.test.cjs`. A integração verifica 12 registros após a carga e a preservação do inventário diante de patrimônio fora da lista ou ausente. O Jest reportou 12 de 12 testes aprovados no resumo agregado. | A lista canônica contém TI-0001 a TI-0012, com nove disponíveis e TI-0004, TI-0007 e TI-0010 em manutenção. |
| CA-02 | SEM_EVIDENCIA | O teste `002/CA-02 valida dimensões, origem, caminho e duplicatas no manifesto` usa dados sintéticos. `.agents/skills/imagens-equipamentos/scripts/photos.ps1` contém as rotinas de invalidação do manifesto e verificação do SHA-256 aprovado. O pacote registra `manual: null`. | Faltam o manifesto verificado do lote real, a aprovação visual vinculada ao SHA-256 de cada JPEG e a confirmação das 12 URLs públicas no Supabase Storage. Os dados sintéticos cobrem apenas a validação do manifesto. |
| CA-03 | SEM_EVIDENCIA | As integrações de `tests/practice-data.test.cjs` usam contas Auth locais e verificam o papel `COLLABORATOR`, zero empréstimos e o bloqueio por e-mail divergente ou empréstimo já devolvido. O pacote registra `manual: null`. | Faltam evidências da conta real em produção, incluindo o vínculo de colaborador, a contagem de empréstimos, a definição da senha pela titular no Supabase Auth e o login com a titular. |
| CA-04 | ATENDIDO | O teste `002/CA-03 e CA-04 carga repetida mantém IDs e vínculo de colaborador e cria zero empréstimos`, em `tests/practice-data.test.cjs`, compara os registros completos entre duas cargas, incluindo IDs, patrimônios e `imagePath`, e verifica o vínculo final e zero empréstimos. O Jest reportou 12 de 12 testes aprovados no resumo agregado. | A integração local cobre a repetição da carga com o mesmo manifesto de teste. A preservação das fotos foi verificada pelos caminhos gravados no banco. Os JPEGs publicados são parte da verificação operacional do CA-02. |

### Spec 003

[Parecer JSON da spec 003](spec-003-revisao-local.json)

| CA | Status do verificador | Evidência | Observação |
|---|---|---|---|
| CA-01 | SEM_EVIDENCIA | Passaram os testes de autenticação em `tests/auth-guard.test.mjs`, de omissão da identidade em `tests/loans.test.cjs` e de acesso ao catálogo, imagem e crédito em `src/App.test.tsx`. O cartão exibe nome, categoria e situação em `src/components.tsx`. O pacote traz `manual: null`. | O teste da imagem verifica o atributo `src` de uma URL simulada. Falta evidência operacional de que as fotos reais do Pixabay carregam no catálogo autenticado em produção, conforme a conferência prevista no plano. |
| CA-02 | SEM_EVIDENCIA | Em `tests/loans.test.cjs`, passaram os testes de persistência imediata, prazo de 14 dias corridos e alteração da disponibilidade. Em `src/App.test.tsx`, passou o teste que exibe a data retornada pela API simulada e marca o cartão como emprestado. `src/components.tsx` mostra o prazo de 14 dias corridos antes da confirmação. | A data testada, às 16h UTC, cai no mesmo dia em UTC e em America/Sao_Paulo. O pacote não inclui a implementação de `formatDate` nem uma evidência que comprove o fuso exigido. A conferência do fluxo em produção prevista no plano também está ausente. |
| CA-03 | ATENDIDO | `npm test` da API passou os casos de equipamento ocupado, manutenção, atraso e limite de três em `tests/loans.test.cjs`. `npm test` da web passou os casos de ação desabilitada em manutenção, motivo visível no diálogo e recusa HTTP 409 em `src/App.test.tsx`. | A API local bloqueou os quatro cenários. No teste da web, o motivo permaneceu visível após a reconsulta e a confirmação ficou desabilitada quando o catálogo atualizado indicou que o equipamento estava emprestado. |
| CA-04 | ATENDIDO | `npm run prisma:migrate` confirmou duas migrations e nenhuma pendência no PostgreSQL local. `npm test` da API passou os dois testes concorrentes de `tests/loans.test.cjs`. O teste de conflito em `src/App.test.tsx` também passou. | Pedidos simultâneos pelo mesmo equipamento gravaram um único empréstimo. Pedidos simultâneos por equipamentos diferentes, com duas vagas já ocupadas pela conta, gravaram somente o terceiro empréstimo. Em cada disputa, o pedido recusado recebeu 409. |
| CA-05 | ATENDIDO | `tests/loans.test.cjs` passou o teste que exclui empréstimos devolvidos, de outro usuário e de outro tenant. `tests/auth-guard.test.mjs` passou a validação do JWT antes da consulta de vínculo. `src/App.test.tsx` passou o teste de exibição do nome e da data prevista. A seleção desses campos consta em `src/loan.controller.ts`. | A evidência local cobre o filtro por conta e tenant e a apresentação dos campos exigidos. Falta o registro da conferência do fluxo em produção com a conta de teste, prevista no plano. |

Depois do parecer da 003, uma conferência local complementar chamou a função de data do frontend com 2026-11-23T02:30:00.000Z. O retorno foi 22/11/2026, o dia anterior em São Paulo. O parecer original foi preservado e a conferência na Vercel segue pendente. [Função de formatação](https://github.com/AbregoAllana/emprestai-sdd-web/blob/183d5ca/src/equipment.ts)
