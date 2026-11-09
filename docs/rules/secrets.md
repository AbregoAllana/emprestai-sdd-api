---
description: Onde cada variável de ambiente vive e qual chave usar
globs: ["**/.env*", "src/**", "api/**", "prisma/**", ".agents/skills/**", ".github/workflows/**"]
alwaysApply: false
---

# Variáveis de ambiente e chaves
> leitor: agente

## Quando
Ao criar ou usar qualquer variável de ambiente, ao instanciar o client
do banco, ou ao escrever código que lê configuração.

## Procedimento
1. Chave pública (anon): só ela pode aparecer em código que roda no
   navegador. A proteção dela são as políticas de acesso do banco.
2. Chave de serviço: ignora todas as políticas. Só em código que roda
   no servidor, nunca em componente de cliente, nunca em variável com
   prefixo público.
3. Variável do app precisa de um nome em `.env.example`, configuração
   local e configuração no projeto Vercel que a consome. Preview usa
   valores próprios. A titular configura os valores de produção.
4. Variáveis de operação, como `PIXABAY_API_KEY`,
   `PRACTICE_TEACHER_USER_ID` e `PRACTICE_PHOTO_MANIFEST`, são
   usadas em sessão local da titular. Documente os nomes no
   `.env.example` da API. Essas variáveis ficam fora da Vercel, do CI
   e do pacote do verificador.
5. O CI usa um banco descartável isolado no runner e acessível pela
   interface local. Mantenha senhas e chaves fora do workflow.

## Verificação
Uma busca por "service" no código que vai para o navegador não
retorna nada. `.env.example` tem todas as chaves que o projeto usa,
sem nenhum valor real.

## Não faça
- Não escreva valor de chave em resposta, commit, log ou comentário.
- Não deixe faltar na Vercel uma variável que o app publicado consome.
- Não contorne uma política de acesso trocando de chave. Se a política
  atrapalha, a política está errada — pare e me avise.
