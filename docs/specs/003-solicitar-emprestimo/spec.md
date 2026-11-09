# Solicitar empréstimo

PRD de empréstimo de equipamentos. ADR-001 (stack) e ADR-003 (operação).

## Critérios de aceite

- CA-01: colaborador vê catálogo autenticado com nome, categoria, situação e fotos reais com crédito Fotos: Pixabay; identidade do tomador fica fora da resposta.
- CA-02: solicitar cria imediatamente com prazo de 14 dias corridos e atualiza o catálogo. O diálogo mostra a data efetiva retornada pelo servidor.
- CA-03: indisponibilidade, manutenção, atraso e limite de 3 abertos bloqueiam nova solicitação com motivo visível.
- CA-04: pedidos simultâneos não criam dois empréstimos abertos do mesmo equipamento nem ultrapassam o limite do usuário.
- CA-05: a consulta autenticada lista somente empréstimos abertos da conta e do tenant, com nome do equipamento e data prevista.

## Fora de escopo

Devolução, Operações, reservas, e-mails e renovação.
