# Entrega da prática

- API: https://github.com/AbregoAllana/emprestai-sdd-api
- Frontend: https://github.com/AbregoAllana/emprestai-sdd-web
- Produção: pendente de configuração na Vercel e no Supabase.
- Evidências: [pareceres independentes](docs/evidencias/verificador.md) e [prova do erro plantado](docs/evidencias/erro-plantado.txt).

## 1. Conflitos: o que foi pedido contra o que já existia

| Pedido | Contrariava o quê | O que foi feito | Por quê | Onde ficou registrado | Commit |
|---|---|---|---|---|---|
| Dois itens em manutenção no briefing | A lista obrigatória inclui TI-0010 | Mantidos os três itens da lista | A titular escolheu a lista exata | Spec 002 e prisma/equipment-practice.json | 72c0d25 |
| Cinco empréstimos e 14 dias úteis | Limite de três do PRD e prazo de 14 dias corridos aplicado pela API de referência | Três empréstimos e 14 dias corridos | A titular manteve a regra de produto e a contagem existente | Spec 003 e src/loan.controller.ts | 25e863a |
| Usar Pexels e remover o crédito do catálogo | A titular pediu Pixabay e o contrato da skill exige crédito com link | Usada a API do Pixabay e mantido o crédito Fotos: Pixabay | Identificar a fonte usada. A troca de provedor diverge do enunciado e a aceitação pelo professor está pendente | Specs 002 e 003, skill e frontend src/App.tsx | 174e2df e 6d5fa2e |
| Instalar sharp | Dependências precisam seguir as rules e os ADRs | Usada a biblioteca de imagens do Windows | O script gera e mede os JPEGs sem incluir nova dependência npm | Skill imagens-equipamentos | 174e2df e 5c6e1cf |
| Escrever a senha no seed | Proibição de versionar senhas | Titular define a senha no Auth. Carga recebe UUID e manifesto | Evitar credenciais no código e no histórico | Spec 002 e prisma/seed.ts | 174e2df |
| Verificador corrige o teste | Independência do verificador | Correção fica com o agente principal | O parecer continua independente da implementação | .codex/agents/verificador-spec.toml | 25e863a |
| Migração pela CLI Supabase ou pelo CI em produção | Prisma é dono do schema e a prática reserva a escrita de produção à titular | Titular executa Prisma Migrate. CI usa banco descartável | Respeitar a decisão técnica e a separação de acessos | docs/adr/003-operacao-pratica.md | 72c0d25 |

## 1b. Lacunas: o que foi pedido de forma incompleta

| Spec | O que faltava | Alternativas | O que foi decidido | Por quê | Commit |
|---|---|---|---|---|---|
| 003 | O que fazer se dois pedidos de itens distintos disputarem a última vaga | Proteger só a unicidade do item ou proteger também a contagem por pessoa | Transação serializável com repetição limitada e o índice existente | Impedir que pedidos simultâneos ultrapassem o limite | 25e863a |
| 003 | Como mostrar o prazo durante a confirmação | Estimar uma data no navegador ou exibir a data efetiva da API após criar | Mostrar 14 dias antes da confirmação e a data efetiva depois, no fuso de São Paulo | Evitar mostrar uma data diferente da registrada no empréstimo | 6d5fa2e |

## 2. Onde o agente fez uma suposição

A primeira fixture de atraso preencheu só o vencimento passado e deixou a data de empréstimo no default atual. O PostgreSQL rejeitou a linha porque o vencimento precisa ser posterior ao empréstimo. O teste foi corrigido para reproduzir um atraso válido antes de interpretar a falha como problema no código de negócio. Outra fixture de devolução também passou a preencher data e autor, como exige a constraint.

## 3. ADR e regra posta à prova

A execução manual da migração mereceu o ADR-003 porque altera uma responsabilidade durável da operação. A regra copiada citava Supabase CLI e comandos pendentes. Foi substituída pelo Prisma Migrate com checks reais e CI descartável. A seleção dos três patrimônios ficou na spec, pois é decisão de carga, não arquitetura.

## 4. Skill e verificador

A [skill](.agents/skills/imagens-equipamentos/SKILL.md) descreve o fluxo. A referência concentra licença, limites da API e checklist. O script verifica dimensões, IDs, hash, caminho e aprovação declarada. A revisão visual de pessoas, marcas, texto e telas é humana. A skill prepara arquivos locais e o upload fica com a titular. Recusas reais ainda não foram contabilizadas.

O verificador recebe a spec, evidências e os commits coordenados. A rotina de fechamento executa checks nas cópias e só aceita relatório completo e vinculado ao par de commits. As rodadas independentes, a reprovação plantada e a reversão estão nos [pareceres](docs/evidencias/verificador.md).

## 5. Pendências da entrega

A revisão da seção 01 separou a configuração da Vercel das variáveis locais da skill e da carga. O CI atual usa um PostgreSQL descartável acessível pela interface local do runner, sem senha fixa no workflow. As revisões anteriores registram uma senha usada exclusivamente por essa fixture de CI, conforme o histórico do workflow. Nenhum segredo de produção foi identificado na varredura por padrões.

As specs 002 e 003 e seus planos vieram antes do código. O commit 25e863a agrupou mais de uma tarefa, de modo que o histórico não comprova a execução de uma tarefa por vez nessa etapa. Para a 004, a titular autorizou a correção da entrada pública e a spec entrou antes do código em 80e9559. Não há aprovação separada do texto da spec registrada.

O enunciado pede verificador, skill, dados publicados, empréstimo publicado e registro final, nessa ordem. O commit 174e2df reúne a skill e a carga da spec 002. O 25e863a introduz o verificador junto com a implementação da spec 003. O histórico não comprova a instalação do verificador antes da skill. Os pareceres foram registrados depois, em e91af93. A ordem de publicação ainda depende da operação em produção.

A entrada pública foi tratada na spec 004 do frontend como correção do ponto de partida da prática. A aplicação oferece a landing na raiz, login em /entrar e catálogo para a sessão autenticada. A validação na Vercel segue pendente.

Chave Pixabay, seleção e revisão das fotos reais, configuração do Supabase e dos dois projetos Vercel, aplicação da carga e smoke da titular, relatório final e tag entrega-pratica nos dois repositórios. O [roteiro de operação](docs/operacao-pratica.md) descreve a sequência. Devolução, Operações, reservas, e-mails e renovação ficaram fora do escopo da implementação.
