const { spawnSync } = require('node:child_process')
const { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')

const folders = { '002': '002-dados-iniciais', '003': '003-solicitar-emprestimo' }

function run(program, args, options = {}) {
  const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options })
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || [result.stdout, result.stderr].filter(Boolean).join('\n') || 'sem saída'
    throw new Error(program + ' falhou: ' + detail)
  }
  return result.stdout.trim()
}

function snapshot(repo, revision, destination) {
  const commit = run('git', ['-C', repo, 'rev-parse', '--verify', revision + '^{commit}'])
  const tar = destination + '.tar'
  run('git', ['-C', repo, 'archive', '-o', tar, commit])
  mkdirSync(destination)
  run('tar', ['-xf', tar, '-C', destination])
  return commit
}

function checks(project, commands, env) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const logs = []
  for (const args of commands) {
    const command = 'npm ' + args.join(' ')
    try {
      logs.push({ command, ok: true, output: run(npm, args, { cwd: project, env, shell: process.platform === 'win32' }) })
    } catch (error) {
      logs.push({ command, ok: false, output: error.message })
      break
    }
  }
  return logs
}

function file(root, name) {
  return { name, content: readFileSync(join(root, name), 'utf8') }
}

function verify(report, inputs, ids) {
  return report.spec === inputs.spec && report.apiCommit === inputs.apiCommit && report.webCommit === inputs.webCommit
    && report.rows.length === ids.length && report.rows.every((row, index) =>
      row.id === ids[index] && row.status === 'ATENDIDO' && row.evidence.trim())
}

function main() {
  const [, , spec, webPath, apiRev, webRev, reportPath, manualPath] = process.argv
  if (!folders[spec] || !webPath || !apiRev || !webRev || !reportPath) {
    throw new Error('Uso: npm run spec:close -- <002|003> <repo-front> <ref-api> <ref-front> <relatorio.json> [evidencia-humana.json]')
  }
  const database = new URL(process.env.PRACTICE_TEST_DATABASE_URL || 'postgresql://missing')
  if (!['127.0.0.1', 'localhost'].includes(database.hostname) || database.pathname !== '/emprestai_sdd') {
    throw new Error('Configure PRACTICE_TEST_DATABASE_URL para o PostgreSQL descartável da prática.')
  }
  const root = mkdtempSync(join(tmpdir(), 'emprestai-verificacao-'))
  const back = join(root, 'api')
  const front = join(root, 'web')
  const review = join(root, 'review')
  const apiCommit = snapshot(process.cwd(), apiRev, back)
  const webCommit = snapshot(resolve(webPath), webRev, front)
  const cleanEnv = { ...process.env }
  for (const name of Object.keys(cleanEnv)) {
    if (/TOKEN|KEY|SECRET|SUPABASE|VERCEL|DATABASE|^PG|PASSWORD|PIXABAY/i.test(name)) delete cleanEnv[name]
  }
  const localEnv = { ...cleanEnv, DATABASE_URL: database.href, DIRECT_URL: database.href, PRACTICE_TEST_DATABASE_URL: database.href }
  const evidence = {
    spec, apiCommit, webCommit,
    documents: ['spec.md', 'plan.md', 'tasks.md'].map((name) => file(back, 'docs/specs/' + folders[spec] + '/' + name)),
    rules: ['restrictions', 'checks', 'tests'].map((name) => file(back, 'docs/rules/' + name + '.md')),
    api: spec === '002'
      ? ['prisma/seed.ts', 'prisma/equipment-practice.json', 'tests/practice-data.test.cjs',
        '.agents/skills/imagens-equipamentos/scripts/photos.ps1'].map((name) => file(back, name))
      : ['src/loan.controller.ts', 'src/equipment.controller.ts', 'tests/loans.test.cjs'].map((name) => file(back, name)),
    web: spec === '003'
      ? ['src/App.tsx', 'src/App.test.tsx', 'src/components.tsx'].map((name) => file(front, name)) : [],
    manual: manualPath ? JSON.parse(readFileSync(resolve(manualPath), 'utf8')) : null,
    apiChecks: checks(back, [['ci', '--no-audit', '--no-fund'], ['run', 'prisma:migrate'], ['test']], localEnv),
    webChecks: checks(front, [['ci', '--no-audit', '--no-fund'], ['run', 'api:generate'], ['run', 'build'], ['run', 'lint'], ['test']], cleanEnv),
  }
  const matches = readFileSync(join(front, 'docs/openapi.json')).equals(readFileSync(join(back, 'docs/openapi.json')))
  const generated = run('git', ['-C', resolve(webPath), 'show', webCommit + ':src/generated/emprestai.ts'])
  const contract = readFileSync(join(front, 'src/generated/emprestai.ts'), 'utf8')
  const normalize = (value) => value.replace(/\r\n/g, '\n').trimEnd()
  evidence.contractMatches = matches && normalize(contract) === normalize(generated)

  const ids = [...evidence.documents[0].content.matchAll(/^- (CA-\d+):/gm)].map((match) => match[1])
  if (!ids.length) throw new Error('A spec não contém critérios enumerados.')
  mkdirSync(join(review, '.codex', 'agents'), { recursive: true })
  cpSync(join(back, '.codex/agents/verificador-spec.toml'), join(review, '.codex/agents/verificador-spec.toml'))
  const schema = join(back, 'scripts/report.schema.json')
  const output = join(root, 'report.json')
  const prompt = 'Inicie o subagente customizado verificador-spec com contexto limpo e encaminhe somente o JSON abaixo. '
    + 'Aguarde o parecer e devolva fielmente as linhas do subagente no schema. Não faça a revisão você mesmo.\n'
    + JSON.stringify(evidence)
  const cli = process.platform === 'win32' ? 'codex.exe' : 'codex'
  run(cli, ['-a', 'never', 'exec', '-C', review, '--sandbox', 'read-only', '--skip-git-repo-check',
    '-c', 'mcp_servers={}', '-c', 'projects.' + JSON.stringify(review) + '.trust_level="trusted"', '--disable', 'shell_tool', '--disable', 'apps', '--disable', 'plugins',
    '--disable', 'request_permissions_tool', '--output-schema', schema, '-o', output, '-'], {
    input: prompt, env: cleanEnv,
  })
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const ready = evidence.contractMatches && [...evidence.apiChecks, ...evidence.webChecks].every((item) => item.ok)
    && verify(report, evidence, ids)
  writeFileSync(resolve(reportPath), JSON.stringify({ ready, ...report }, null, 2) + '\n')
  console.log(ready ? 'PRONTA' : 'NÃO PRONTA')
  if (!ready) process.exitCode = 1
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
