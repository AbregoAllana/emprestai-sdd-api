# Plano — Solicitar empréstimo

1. Estender os endpoints existentes, protegendo concorrência no PostgreSQL e filtrando sempre por tenant e usuário quando aplicável (CA-01 a CA-05).
2. Versionar o contrato REST, gerar o cliente e integrar imagens, pedido e empréstimos na SPA (CA-01 a CA-05).
3. Verificar as duas cópias no mesmo par de commits e conferir o fluxo de produção com a conta de teste.

4. Testar os campos do JWT com uma chave descartável e reconsultar o catálogo após uma recusa HTTP 409 (CA-01, CA-03, CA-04, CA-05).
