# Plano — Dados iniciais

1. Criar a skill Pixabay com manifesto e revisão humana (CA-02).
2. Adicionar image_path opcional e aproveitar o índice parcial por tenant/patrimônio (CA-01, CA-04).
3. Validar o manifesto e executar a carga idempotente após upload. Vincular a conta Auth existente, sem administrar sua senha (CA-01 a CA-04).
4. Validar e-mail, ausência de empréstimos e inventário canônico na mesma transação da carga. Preservar os dados se a carga for bloqueada (CA-01, CA-03, CA-04).
5. Conferir localmente e validar URLs e login com a titular em produção.
