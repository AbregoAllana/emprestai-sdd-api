# Solicitar empréstimo

PRD de empréstimo de equipamentos. ADR-001 (stack) e ADR-003 (operação).

## Critérios de aceite

- CA-01: colaborador vê catálogo autenticado com nome, categoria, situação e fotos reais com crédito Fotos: Pixabay; identidade do tomador fica fora da resposta.
- CA-02: solicitar cria imediatamente com prazo de 14 dias corridos e atualiza o catálogo. O diálogo mostra a data efetiva retornada pelo servidor.
- CA-03: indisponibilidade, manutenção, atraso e limite de 3 abertos bloqueiam nova solicitação com motivo visível.
- CA-04: pedidos simultâneos não criam dois empréstimos abertos do mesmo equipamento nem ultrapassam o limite do usuário.
- CA-05: a consulta autenticada lista somente empréstimos abertos da conta e do tenant, com nome do equipamento e data prevista.

## Decisões sobre lacunas

- Pedidos simultâneos de equipamentos diferentes também disputam as vagas do colaborador. A API usa transação serializável com repetição limitada para proteger a contagem, além do índice de empréstimo aberto por equipamento.
- Antes de confirmar, a interface mostra o prazo de 14 dias corridos. Após a criação, mostra a data efetiva retornada pela API, exibida no fuso America/Sao_Paulo.

## Revisão do acesso e de conflitos (CA-01, CA-03, CA-04, CA-05)

A API exige assinatura válida, emissor do projeto Supabase Auth, audiência authenticated e expiração válida. A validação do vínculo do usuário com o tenant continua obrigatória.

Quando a API recusa uma solicitação com HTTP 409, o frontend mostra o motivo e consulta o catálogo novamente. Se o equipamento não estiver mais disponível, a confirmação fica bloqueada no diálogo atual.

## Fora de escopo

Devolução, Operações, reservas, e-mails e renovação.
