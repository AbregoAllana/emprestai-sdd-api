# Entrega da prática

## Links

- [Backend no GitHub](https://github.com/AbregoAllana/emprestai-sdd-api) · [PR da API](https://github.com/AbregoAllana/emprestai-sdd-api/pull/1)
- [Frontend no GitHub](https://github.com/AbregoAllana/emprestai-sdd-web) · [PR do frontend](https://github.com/AbregoAllana/emprestai-sdd-web/pull/1)
- Vercel: publicação e URL funcional pendentes.
- Tag entrega-pratica: pendente nos dois repositórios. Veja o [roteiro de tag final](docs/operacao-pratica.md#tag-final).

## 1. Conflitos: o que foi pedido contra o que já existia

| Pedido | Contrariava o quê | O que foi feito | Por quê | Onde ficou registrado | Commit |
|---|---|---|---|---|---|
| Dois itens em manutenção no briefing | A lista obrigatória inclui TI-0010 | Mantive TI-0004, TI-0007 e TI-0010 em manutenção | Escolhi seguir a lista exata e manter os outros nove disponíveis | [Spec 002](docs/specs/002-dados-iniciais/spec.md) e [lista](prisma/equipment-practice.json) | 72c0d25 |
| Cinco empréstimos abertos | O PRD limita cada pessoa a três itens | Mantive o limite de três | Preservar a regra já aprovada pelo time de Operações | [PRD](docs/PRD.md) e [spec 003](docs/specs/003-solicitar-emprestimo/spec.md) | 25e863a |
| Prazo de 14 dias úteis | O PRD prevê 14 dias e o backend de referência contava dias corridos | Mantive 14 dias corridos | Escolhi preservar a contagem existente | [Spec 003](docs/specs/003-solicitar-emprestimo/spec.md) e [teste do prazo](tests/loans.test.cjs#L8) | 25e863a |
| Usar exclusivamente Pexels | Escolhi usar Pixabay durante o planejamento | Configurei a skill para consultar apenas a API do Pixabay | Manter uma única fonte com API, autoria e licença rastreáveis. O desvio do enunciado permanece registrado e aguarda aceitação do professor | [Spec 002](docs/specs/002-dados-iniciais/spec.md) e [skill](.agents/skills/imagens-equipamentos/SKILL.md) | 174e2df |
| Retirar o crédito do catálogo | O contrato da skill pede crédito com link ao provedor | Mantive Fotos: Pixabay com link junto ao catálogo | Identificar a fonte que de fato foi usada | [Spec 003](docs/specs/003-solicitar-emprestimo/spec.md) e [catálogo](https://github.com/AbregoAllana/emprestai-sdd-web/blob/183d5ca/src/App.tsx#L86) | 6d5fa2e |
| Instalar sharp | As dependências precisam seguir as rules e os ADRs | Usei a biblioteca de imagens do Windows | O script gera e mede o JPEG sem adicionar dependência npm | [Script da skill](.agents/skills/imagens-equipamentos/scripts/photos.ps1) | 174e2df, 5c6e1cf |
| Escrever a senha no seed | O enunciado proíbe versionar senhas | A titular define a senha no Auth. A carga recebe o UUID e o manifesto | Manter a credencial fora do código e do Git | [Spec 002](docs/specs/002-dados-iniciais/spec.md) e [seed](prisma/seed.ts) | 174e2df |
| Deixar o verificador corrigir o próprio teste | O papel exige revisão independente | A correção fica com quem implementa | A reprovação deve continuar visível e ser reavaliada em outra rodada | [Verificador](.codex/agents/verificador-spec.toml) e [prova](docs/evidencias/verificador.md#erro-plantado--003ca-02) | 25e863a, 530334d |
| Aplicar migração pela CLI do Supabase ou pelo CI em produção | Prisma é o dono do schema e a prática reserva a escrita de produção à titular | Migração Prisma manual por conexão direta. CI usa banco descartável | Preservar a ferramenta de migração e separar acesso de teste e produção | [ADR-003](docs/adr/003-operacao-pratica.md) e [regra de migração](docs/rules/migration.md) | 72c0d25 |

## 1b. Lacunas: o que foi pedido de forma incompleta

| Spec | O que faltava | Alternativas | O que foi decidido | Por quê | Commit |
|---|---|---|---|---|---|
| 002 | Como confirmar que a aprovação visual ainda vale depois de preparar a foto de novo | Guardar só o ID ou vincular a aprovação ao arquivo final | Exigir SHA-256 do JPEG revisado e invalidar o manifesto anterior a cada Prepare ou Verify | Alterar a foto exige outra revisão. Uma execução com falha precisa ficar sem manifesto válido | a53b815 |
| 002 | Como proceder se a conta ou o inventário já tiverem dados incompatíveis | Aceitar, apagar os dados ou interromper a carga | Conferir o e-mail, exigir zero empréstimos e interromper se houver equipamento fora da lista ou sem patrimônio | Preservar registros existentes e impedir sucesso indevido | 3054549, ac0973c |
| 003 | O que fazer se dois pedidos de itens distintos disputarem a última vaga | Proteger só a unicidade do item ou também a contagem por pessoa | Usar transação serializável com repetição limitada e o índice existente | Impedir que solicitações simultâneas ultrapassem o limite | 25e863a |
| 003 | Qual data mostrar no diálogo | Estimar no navegador ou exibir o valor calculado pela API | Mostrar o prazo antes da confirmação e a data efetiva depois, no fuso de São Paulo | O vencimento exibido precisa coincidir com o empréstimo registrado | 6d5fa2e |
| 003 | Quais campos do JWT a API deve exigir | Conferir só a assinatura ou validar também emissor, audiência e expiração | Exigir o emissor do projeto, audiência authenticated, expiração válida e vínculo no tenant | O catálogo e os empréstimos exigem uma sessão destinada à aplicação | d3d02b0, 9a29446 |
| 003 | Como atualizar o catálogo para quem perde a disputa | Mostrar só a recusa ou consultar a disponibilidade novamente | Manter o motivo do 409, reconsultar o catálogo e bloquear a confirmação se o item estiver indisponível | O usuário precisa ver o novo estado sem recarregar a página | 4fbc07e, 183d5ca |

As decisões estão na [spec 002](docs/specs/002-dados-iniciais/spec.md) e na [spec 003](docs/specs/003-solicitar-emprestimo/spec.md).

## 2. Onde o agente tentou decidir por você

Na primeira versão da skill, o agente tratou a aprovação de um ID como suficiente para aprovar a foto. Na revisão da seção 03, ele substituiu os bytes de uma fixture, manteve o ID e mostrou que a aprovação antiga continuava passando. A revisão também mostrou que uma falha deixava o manifesto anterior na pasta. Autorizei a correção: a aprovação passou a referenciar o hash do JPEG revisado, e só uma verificação bem-sucedida deixa um manifesto para a carga. [Correção e reteste](https://github.com/AbregoAllana/emprestai-sdd-api/commit/a53b815)

## 3. Uma decisão que merece (ou não) um ADR

A migração manual virou o [ADR-003](docs/adr/003-operacao-pratica.md). A alternativa era um job de CI disparado pela titular. Escolhi executar o Prisma Migrate em terminal próprio porque o enunciado reserva a escrita de produção à titular. Essa escolha muda quem tem acesso ao banco e quem aplica cada migração. Por isso ela fica no ADR. A lista de patrimônios em manutenção é uma regra da carga e fica na spec 002.

## 4. A skill imagens-equipamentos

- O [SKILL.md](.agents/skills/imagens-equipamentos/SKILL.md) descreve a sequência que a pessoa precisa seguir. As [referências](.agents/skills/imagens-equipamentos/references/pixabay.md) guardam a documentação, a licença e o checklist visual, pois são material de consulta durante a escolha.
- O [script](.agents/skills/imagens-equipamentos/scripts/photos.ps1) consulta a API, gera e mede os JPEGs, checa IDs e hashes repetidos, vincula a aprovação ao SHA-256 e produz o manifesto com origem, autoria, licença e caminho. O código cuida dessas verificações repetíveis. A pessoa revisa pessoas, marcas, texto e telas porque esses critérios dependem de inspecionar cada foto.
- A skill gera arquivos locais. O upload fica em sessão separada da titular, que tem acesso ao Storage de produção. O pacote do agente e do verificador não recebe credenciais de escrita de produção. [Roteiro de publicação](docs/operacao-pratica.md#publicação-executada-pela-titular)
- Fotos reprovadas na revisão visual real: **pendente de contagem e motivos**. Foram usados 12 JPEGs sintéticos para testar dimensões, duplicação, aprovação por hash e manifesto. A seleção real depende da chave do Pixabay.

## 5. O subagente verificador

O [verificador](.codex/agents/verificador-spec.toml) é chamado no fechamento de cada spec. Escolhi esse gatilho porque é o momento em que os checks, a revisão por CA e a evidência da versão candidata podem ser comparados. O [comando de entrega](docs/operacao-pratica.md#tag-final) executa o fechamento das specs 002, 003 e 004 para o mesmo par de commits.

A sessão efêmera recebe spec, plano, tarefas, regras aplicáveis, código relacionado, resultados dos checks e evidência humana sanitizada. Ela precisa ler esses registros porque a conversa de implementação não comprova o estado dos commits. API e frontend são repositórios separados. A rotina coleta evidência dos dois, compara o contrato quando aplicável e recusa pareceres com hashes divergentes.

O harness roda a sessão em modo de leitura, sem shell, apps e plugins, e filtra variáveis de credenciais. O verificador emite o parecer. Os hooks locais bloqueiam a tag sem autorização e o GitHub protege sua criação, alteração e exclusão. A titular libera temporariamente a criação depois de conferir os pareceres e os commits publicados. [Rotina de fechamento](scripts/close-spec.cjs) · [Operação da tag](docs/operacao-pratica.md#tag-final)

## 6. O verificador em ação

### Rodadas e correções

| Rodada | CA ou escopo | Causa ou resultado | Correção ou próxima evidência |
|---|---|---|---|
| Checks iniciais da API | Suíte de integração 003 | Jest tentou carregar o módulo ESM de autenticação em CommonJS | O teste direto do controller passou a isolar o guard. A autenticação real tem um teste separado com JWKS local. [Teste do controller](tests/loans.test.cjs#L1) e [teste do guard](tests/auth-guard.test.mjs) |
| Fixtures da primeira suíte | 003/CA-03 e 003/CA-05 | Datas de atraso incompatíveis com a constraint e devolução sem autor | Corrigi os dados de teste para reproduzir atraso e devolução válidos antes de avaliar a API. [Fixtures da suíte](tests/loans.test.cjs#L50) |
| Erro plantado | 003/CA-02 | Reprovou o prazo de 15 dias, com duas falhas na suíte | Reversão para 14 dias e nova rodada com 11 testes passando. [Log](docs/evidencias/erro-plantado.txt) |
| Primeira revisão independente | 002/CA-02, 002/CA-03 e 003/CA-01 | Evidência local com fotos e usuários sintéticos | Validar fotos, URLs, login e catálogo no deploy. [Parecer histórico](docs/evidencias/verificador.md#revisão-local-das-duas-specs) |
| Fechamento automatizado no Windows | Checks da 003 | Caminho temporário abreviado fez o Vitest falhar. A sessão do verificador também ficou sem resposta na primeira tentativa | Normalização do caminho e execução isolada do verificador. [Correção](https://github.com/AbregoAllana/emprestai-sdd-api/commit/3fbe2da) |
| Nova rodada automatizada | 003/CA-02 a CA-05 | A saída do Jest não aparecia no pacote entregue ao verificador | Captura de stdout e stderr dos checks. [Correção](https://github.com/AbregoAllana/emprestai-sdd-api/commit/9ec2023) |
| Entrada pública | 004/CA-01 a CA-03 | Sete testes passaram no par daquela rodada. Faltava conferir as rotas e a tela estreita no deploy | Conferir a landing e o login na Vercel. [Parecer da 004](docs/evidencias/spec-004-local.json) |

A auditoria técnica também reproduziu aprovação de foto desatualizada, carga sobre dados incompatíveis, aceite de JWT inválido e catálogo desatualizado após 409. Os respectivos retestes estão associados aos commits [a53b815](https://github.com/AbregoAllana/emprestai-sdd-api/commit/a53b815), [ac0973c](https://github.com/AbregoAllana/emprestai-sdd-api/commit/ac0973c), [9a29446](https://github.com/AbregoAllana/emprestai-sdd-api/commit/9a29446) e [183d5ca](https://github.com/AbregoAllana/emprestai-sdd-web/commit/183d5ca).

### Prova do erro plantado

| Commit | Resultado do verificador | Evidência |
|---|---|---|
| [7e5d8ba](https://github.com/AbregoAllana/emprestai-sdd-api/commit/7e5d8ba78c2e0defa1e6da1b3005903c8f0a7ce4) | REPROVADO | Alterar o prazo para 15 dias fez os dois testes do CA-02 falharem. |
| [530334d](https://github.com/AbregoAllana/emprestai-sdd-api/commit/530334deed15fe6a69e251bbbdfdff93645d2d6c) | ATENDIDO LOCAL | A reversão restaurou 14 dias. Os 11 testes daquela versão passaram. |

[Branch da prova](https://github.com/AbregoAllana/emprestai-sdd-api/tree/codex/prova-verificador) · [Saída original dos testes](docs/evidencias/erro-plantado.txt)

### Pareceres das specs 002 e 003

- [Spec 002, revisão local](docs/evidencias/spec-002-revisao-local.json). Carga repetida e bloqueios de identidade, empréstimos anteriores e inventário incompatível conferidos localmente. Fotos reais, URLs públicas e login do professor seguem pendentes.
- [Spec 003, revisão local](docs/evidencias/spec-003-revisao-local.json). Prazo, bloqueios, concorrência, autenticação e atualização após 409 conferidos localmente. O catálogo com fotos e o smoke na Vercel seguem pendentes.

As [tabelas da revisão local atual](docs/evidencias/verificador.md#revisão-local-após-as-correções--specs-002-e-003) registram o par API 9a29446 e frontend 183d5ca. As duas rotinas devolveram NÃO PRONTA. A revisão 003 pediu evidência adicional do fuso no CA-02. A conferência local complementar confirmou 22/11/2026 em São Paulo para 2026-11-23T02:30:00.000Z. As **tabelas finais de produção** ficam pendentes do fechamento sobre os commits publicados, com evidência humana. O [histórico de pareceres](docs/evidencias/verificador.md) preserva as rodadas anteriores.

## 7. Uma regra sua que esta prática pôs à prova

A [regra de segredos](docs/rules/secrets.md) mandava cadastrar toda variável nova na Vercel. Isso colocaria a chave do Pixabay e as variáveis da carga num ambiente que não as usa. Separei variáveis do app publicado das variáveis locais da titular. Também retirei a senha fixa do banco descartável no workflow atual. Ela aparece em commits antigos como credencial exclusiva da fixture de CI. A varredura por padrões não encontrou segredos de produção. [Correção da regra e do CI](https://github.com/AbregoAllana/emprestai-sdd-api/commit/de90d2b)

## 8. O que ficou de fora e o que faria diferente

- A spec 002 ficou sem tela de catálogo, cadastro pela interface e importação de planilha. A spec 003 ficou sem devolução pela interface, tela de Operações, reserva futura, e-mail e renovação. A rota de devolução já existia na base e ficou fora da implementação nova.
- Faltam a seleção e a revisão das fotos reais, a configuração dos ambientes de produção, a carga, a conferência da seção 07 pela titular, os pareceres finais e a tag. A landing da spec 004 também precisa de conferência no deploy. [Roteiro de publicação](docs/operacao-pratica.md#publicação-executada-pela-titular) · [Checklist da seção 07](docs/operacao-pratica.md#07--conferência-no-link-de-produção)
- Eu instalaria e testaria o verificador antes de preparar a skill. O histórico registra a skill com a carga 002 em 174e2df e o verificador com a implementação 003 em 25e863a. Esse segundo commit também agrupou tarefas. Eu separaria as tarefas em commits menores para tornar a ordem verificável. Para a spec 004, eu registraria a aprovação do texto da spec separadamente da autorização geral para corrigir a landing.
- Eu testaria desde o início dois casos que a primeira rodada deixou passar: substituir o JPEG mantendo o ID e repetir a carga sobre registros legados. Esses cenários mudaram o comportamento da skill e do seed e hoje estão documentados na [spec 002](docs/specs/002-dados-iniciais/spec.md).
