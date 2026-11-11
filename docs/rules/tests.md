## Quando
Ao escrever, alterar ou remover qualquer teste.

## Procedimento
1. Testes rodam contra o banco local. Nunca contra o remoto.
2. O nome do teste cita o critério que ele prova: test_ca_03_...
3. Teste de endpoint verifica status E corpo.
4. Tabela com política de acesso tem um teste que prova o bloqueio:
   o mesmo dado, com outro usuário, não retorna.

## Verificação
`npm test` passa com o PostgreSQL descartável inicializado por `tests/bootstrap.sql` e as migrations aplicadas por `npm run prisma:migrate`. Configure `PRACTICE_TEST_DATABASE_URL`, `DATABASE_URL` e `DIRECT_URL` para o banco local `emprestai_sdd`. Nenhum teste de integração pode ficar pulado.
