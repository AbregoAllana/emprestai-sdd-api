# Entrega da prática

- API: https://github.com/AbregoAllana/emprestai-sdd-api
- Frontend: https://github.com/AbregoAllana/emprestai-sdd-web
- Produção: pendente de configuração na Vercel e no Supabase.
- Evidências: [pareceres independentes](docs/evidencias/verificador.md) e [prova do erro plantado](docs/evidencias/erro-plantado.txt).

## 1. Conflitos e lacunas

| Pedido ou lacuna | Alternativas | Decisão e motivo | Registro |
|---|---|---|---|
| Dois ou três itens em manutenção | Texto narrativo ou lista obrigatória | Lista exata. TI-0010 também fica em manutenção | Spec 002 e prisma/equipment-practice.json, 72c0d25 |
| Cinco abertos e 14 úteis | Alterar PRD ou preservar regra existente | Três abertos e 14 corridos por decisão da titular | Spec 003 e src/loan.controller.ts, 25e863a |
| Pexels e crédito removido | Pexels com crédito ou outra fonte autorizada | Pixabay por decisão explícita da titular. Manter crédito ao provedor junto ao catálogo | Spec 002, skill e front src/App.tsx, 174e2df e 6d5fa2e |
| Instalar sharp | Nova dependência ou Windows PowerShell | Usar biblioteca de imagens do Windows e checar dimensões do JPEG efetivo | Skill, 174e2df e 5c6e1cf |
| Senha no seed | Segredo versionado ou criação no Auth | Titular define no Auth. Carga recebe UUID e manifesto | Spec 002 e prisma/seed.ts, 174e2df |
| Verificador corrige teste | Corrigir no mesmo contexto ou devolver ao implementador | Separar verificação de correção para manter a independência | .codex/agents/verificador-spec.toml, 25e863a |
| Migração pela CLI Supabase ou CI de produção | CI com disparo humano ou execução direta | Titular executa Prisma Migrate diretamente. CI fica no banco descartável | docs/adr/003-operacao-pratica.md, 72c0d25 |
| Corrida entre pedidos distintos no limite | Tratar só a unicidade do equipamento ou proteger também a contagem | Transação serializável com retry limitado e índice existente | Spec 003, src/loan.controller.ts e tests/loans.test.cjs, 25e863a |
| Vencimento exibido na confirmação | Data estimada no browser ou data efetiva retornada pela API | Mostrar 14 dias antes da confirmação e o vencimento real depois. Formatar em São Paulo | Spec 003 e front src/components.tsx, 6d5fa2e |

## 2. Onde o agente fez uma suposição

A primeira fixture de atraso preencheu só o vencimento passado e deixou a data de empréstimo no default atual. O PostgreSQL rejeitou a linha porque o vencimento precisa ser posterior ao empréstimo. O teste foi corrigido para reproduzir um atraso válido antes de interpretar a falha como problema no código de negócio. Outra fixture de devolução também passou a preencher data e autor, como exige a constraint.

## 3. ADR e regra posta à prova

A execução manual da migração mereceu o ADR-003 porque altera uma responsabilidade durável da operação. A regra copiada citava Supabase CLI e comandos pendentes. Foi substituída pelo Prisma Migrate com checks reais e CI descartável. A seleção dos três patrimônios ficou na spec, pois é decisão de carga, não arquitetura.

## 4. Skill e verificador

A [skill](.agents/skills/imagens-equipamentos/SKILL.md) descreve o fluxo. A referência concentra licença, limites da API e checklist. O script verifica dimensões, IDs, hash, caminho e aprovação declarada. A revisão visual de pessoas, marcas, texto e telas é humana. A skill prepara arquivos locais e o upload fica com a titular. Recusas reais ainda não foram contabilizadas.

O verificador recebe a spec, evidências e os commits coordenados. A rotina de fechamento executa checks nas cópias e só aceita relatório completo e vinculado ao par de commits. As rodadas independentes, a reprovação plantada e a reversão estão nos [pareceres](docs/evidencias/verificador.md).

## 5. Pendências da entrega

Chave Pixabay, seleção e revisão das fotos reais, configuração do Supabase e dos dois projetos Vercel, aplicação da carga e smoke da titular, relatório final e tag entrega-pratica nos dois repositórios. O [roteiro de operação](docs/operacao-pratica.md) descreve a sequência. Devolução, Operações, reservas, e-mails e renovação ficaram fora do escopo da implementação.
