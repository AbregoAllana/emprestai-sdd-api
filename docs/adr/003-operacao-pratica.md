# ADR-003 — Operação da prática

## Contexto
O ADR-001 entrega a migração ao CI. A prática reserva as escritas no banco e no Storage de produção à titular.

## Decisão
Prisma Migrate continua dono único do schema. O CI usa somente infraestrutura descartável. A titular aplica o Prisma Migrate com a conexão direta, faz upload, executa a carga e promove o deploy. A API publicada usa a conexão de runtime. A alternativa de CI com disparo humano foi considerada e a titular escolheu executar a migração diretamente.

## Consequência
A ordem da publicação e a versão aplicada precisam ser conferidas na entrega. A preparação local e o verificador ficam sem credenciais de produção.
