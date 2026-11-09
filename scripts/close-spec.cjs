const { spawnSync } = require('node:child_process')
const { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')

const folders = { '002': '002-dados-iniciais', '003': '003-solicitar-emprestimo', '004': '004-entrada-publica' }

function run(program, args, { includeStderr = false, ...options } = {}) {
  const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options })
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || [result.stdout, result.stderr].filter(Boolean).join('\n') || 'sem saída'
    throw new Error(program + ' falhou: ' + detail)
  }
  return (includeStderr ? [result.stdout, result.stderr].filter(Boolean).join('\n') : result.stdout).trim()
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
      logs.push({ command, ok: true, output: run(npm, args, { cwd: project, env, shell: process.platform === 'win32', includeStderr: true }) })
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
    throw new Error('Uso: npm run spec:close -- <002|003|004> <repo-front> <ref-api> <ref-front> <relatorio.json> [evidencia-humana.json]')
  }
  const webOnly = spec === '004'
  const database = webOnly ? null : new URL(process.env.PRACTICE_TEST_DATABASE_URL || 'postgresql://missing')
  if (database && (!['127.0.0.1', 'localhost'].includes(database.hostname) || database.pathname !== '/emprestai_sdd')) {
    throw new Error('Configure PRACTICE_TEST_DATABASE_URL para o PostgreSQL descartável da prática.')
  }
  const root = mkdtempSync(join(realpathSync.native(tmpdir()), 'emprestai-verificacao-'))
  const back = join(root, 'api')
  const front = join(root, 'web')
  const review = join(root, 'review')
  const apiCommit = snapshot(process.cwd(), apiRev, back)
  const webCommit = snapshot(resolve(webPath), webRev, front)
  const cleanEnv = { ...process.env }
  for (const name of Object.keys(cleanEnv)) {
    if (/TOKEN|KEY|SECRET|SUPABASE|VERCEL|DATABASE|^PG|PASSWORD|PIXABAY/i.test(name)) delete cleanEnv[name]
  }
  const install = ['ci', '--prefer-offline', '--no-audit', '--no-fund']
  const specRoot = webOnly ? front : back
  const evidence = {
    spec, apiCommit, webCommit,
    documents: ['spec.md', 'plan.md', 'tasks.md'].map((name) => file(specRoot, 'docs/specs/' + folders[spec] + '/' + name)),
    rules: ['restrictions', 'checks', 'tests'].map((name) => file(specRoot, 'docs/rules/' + name + '.md')),
    api: [],
    web: [],
    manual: manualPath ? JSON.parse(readFileSync(resolve(manualPath), 'utf8')) : null,
    apiChecks: [],
    webChecks: [],
    contractMatches: null,
  }

  if (database) {
    const localEnv = { ...cleanEnv, DATABASE_URL: database.href, DIRECT_URL: database.href, PRACTICE_TEST_DATABASE_URL: database.href }
    const apiFiles = spec === '002'
      ? ['prisma/seed.ts', 'prisma/equipment-practice.json', 'tests/practice-data.test.cjs',
        '.agents/skills/imagens-equipamentos/scripts/photos.ps1']
      : ['src/loan.controller.ts', 'src/equipment.controller.ts', 'src/auth.guard.ts', 'tests/loans.test.cjs', 'tests/auth-guard.test.mjs']
    evidence.api = apiFiles.map((name) => file(back, name))
    evidence.apiChecks = checks(back, [install, ['run', 'prisma:migrate'], ['test']], localEnv)
  }
  const webFiles = webOnly
    ? ['src/App.tsx', 'src/Landing.tsx', 'src/App.test.tsx', 'src/index.css', 'vercel.json']
    : ['src/App.tsx', 'src/App.test.tsx', 'src/components.tsx', 'src/api-request.ts']
  if (spec !== '002') evidence.web = webFiles.map((name) => file(front, name))

  const webCommands = [install, ['run', 'build'], ['run', 'lint'], ['test']]
  if (!webOnly) webCommands.splice(1, 0, ['run', 'api:generate'])
  evidence.webChecks = checks(front, webCommands, cleanEnv)
  if (!webOnly) {
    const matches = readFileSync(join(front, 'docs/openapi.json')).equals(readFileSync(join(back, 'docs/openapi.json')))
    const generated = run('git', ['-C', resolve(webPath), 'show', webCommit + ':src/generated/emprestai.ts'])
    const contract = readFileSync(join(front, 'src/generated/emprestai.ts'), 'utf8')
    const normalize = (value) => value.replace(/\r\n/g, '\n').trimEnd()
    evidence.contractMatches = matches && normalize(contract) === normalize(generated)
  }

  const ids = [...evidence.documents[0].content.matchAll(/^- (CA-\d+):/gm)].map((match) => match[1])
  if (!ids.length) throw new Error('A spec não contém critérios enumerados.')
  mkdirSync(join(review, '.codex', 'agents'), { recursive: true })
  cpSync(join(back, '.codex/agents/verificador-spec.toml'), join(review, '.codex/agents/verificador-spec.toml'))
  const schema = join(back, 'scripts/report.schema.json')
  const output = join(root, 'report.json')
  const role = readFileSync(join(back, '.codex/agents/verificador-spec.toml'), 'utf8')
    .split('"""')[1].trim()
  const prompt = role + '\nEsta sessão é o processo verificador independente. Use somente o pacote a seguir.\n'
    + JSON.stringify(evidence)
  const cli = process.platform === 'win32' ? 'codex.exe' : 'codex'
  run(cli, ['-a', 'never', 'exec', '-C', review, '--sandbox', 'read-only', '--skip-git-repo-check',
    '--ephemeral', '-c', 'mcp_servers={}', '-c', 'mcp_servers.node_repl.enabled=false',
    '-c', 'projects.' + JSON.stringify(review) + '.trust_level="trusted"',
    '--disable', 'shell_tool', '--disable', 'apps', '--disable', 'plugins',
    '--disable', 'request_permissions_tool', '--output-schema', schema, '-o', output, '-'], {
    input: prompt, env: cleanEnv, timeout: 180_000,
  })
  const report = JSON.parse(readFileSync(output, 'utf8'))
  const manualComplete = Array.isArray(evidence.manual) && ids.every((id) => evidence.manual.some(
    (row) => row.id === id && typeof row.evidence === 'string' && row.evidence.trim(),
  ))
  const ready = manualComplete && (webOnly || evidence.contractMatches) && [...evidence.apiChecks, ...evidence.webChecks].every((item) => item.ok)
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
