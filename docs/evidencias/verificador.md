# Pareceres independentes

## Erro plantado — 003/CA-02

O subagente recebeu apenas o CA, os commits e a saída dos testes. A [saída completa](erro-plantado.txt) registra as duas rodadas.

| Commit | Status | Evidência |
|---|---|---|
| 7e5d8ba78c2e0defa1e6da1b3005903c8f0a7ce4 | REPROVADO | Exit 1. Recebeu 15 dias em vez de 14 em dois testes do CA-02. |
| 530334deed15fe6a69e251bbbdfdff93645d2d6c | ATENDIDO LOCAL | Exit 0, 11/11 testes, incluindo os dois do CA-02. |

A demonstração ficou na branch local codex/prova-verificador.

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
