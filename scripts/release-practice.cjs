const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')

const specs = ['002', '003', '004']
const tag = 'entrega-pratica'
const tagRef = 'refs/tags/' + tag
const api = resolve(__dirname, '..')
const hooks = join(api, '.githooks').replaceAll('\\', '/')

function git(repo, ...args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8' }).trim()
}

function receiptPath(repo) {
  return join(git(repo, 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'entrega-pratica.json')
}

function optionalGit(repo, ...args) {
  try {
    return git(repo, ...args)
  } catch (error) {
    if (error.status === 1) return ''
    throw error
  }
}

function install(repos) {
  for (const repo of repos) {
    const current = optionalGit(repo, 'config', '--get', 'core.hooksPath').replaceAll('\\', '/')
    if (current && current !== hooks) throw new Error('Já existe core.hooksPath em ' + repo + '. Integre os hooks antes de continuar.')
  }
  for (const repo of repos) git(repo, 'config', '--local', 'core.hooksPath', hooks)
}

function validateTag(repo, object) {
  const path = receiptPath(repo)
  if (!existsSync(path) || !/^[a-f0-9]{40,64}$/.test(object) || /^0+$/.test(object)) {
    throw new Error('A tag entrega-pratica exige autorização do comando npm run release:practice.')
  }
  const receipt = JSON.parse(readFileSync(path, 'utf8'))
  const text = git(repo, 'cat-file', 'tag', object)
  const separator = text.indexOf('\n\n')
  const header = text.slice(0, separator).split(/\r?\n/)
  const message = text.slice(separator + 2)
  if (!header.includes('object ' + receipt.commit) || !header.includes('type commit')
      || !header.includes('tag ' + tag) || message !== receipt.message) {
    throw new Error('A tag não corresponde ao commit e aos pareceres autorizados.')
  }
  return receipt
}

function guard(mode) {
  if (mode === 'reference' && process.argv[4] !== 'prepared') return
  for (const line of readFileSync(0, 'utf8').split(/\r?\n/)) {
    const fields = line.trim().split(/\s+/)
    if (fields[2] === tagRef) validateTag(process.cwd(), fields[1])
  }
}

function release(front, evidenceDirectory) {
  const repos = [api, front]
  const commits = repos.map((repo) => git(repo, 'rev-parse', 'HEAD'))
  const evidence = specs.map((spec) => join(evidenceDirectory, spec + '.json'))
  for (const path of evidence) {
    if (!existsSync(path)) throw new Error('Falta evidência humana: ' + path)
  }
  let existingMessage
  for (const repo of repos) {
    if (git(repo, 'status', '--porcelain')) throw new Error('Finalize as alterações locais em ' + repo)
    git(repo, 'var', 'GIT_COMMITTER_IDENT')
    const existing = optionalGit(repo, 'rev-parse', '--verify', '--quiet', tagRef)
    if (existing) {
      const { message } = validateTag(repo, existing)
      const pair = JSON.parse(message)
      if (pair.apiCommit !== commits[0] || pair.webCommit !== commits[1] || (existingMessage && existingMessage !== message)) {
        throw new Error('Já existe entrega-pratica com outro par de commits ou pareceres.')
      }
      existingMessage = message
    }
  }
  const out = mkdtempSync(join(realpathSync.native(tmpdir()), 'emprestai-entrega-'))
  console.log('Pareceres da entrega em ' + out)
  const fingerprints = specs.map((spec, index) => {
    const report = join(out, spec + '.json')
    execFileSync(process.execPath, [
      join(__dirname, 'close-spec.cjs'), spec, front, ...commits, report, evidence[index],
    ], { cwd: api, stdio: 'inherit' })
    const contents = readFileSync(report)
    const result = JSON.parse(contents)
    if (!result.ready || result.spec !== spec || result.apiCommit !== commits[0] || result.webCommit !== commits[1]) {
      throw new Error('Parecer não autorizou a entrega: ' + report)
    }
    return { spec, sha256: createHash('sha256').update(contents).digest('hex') }
  })

  const message = existingMessage || JSON.stringify({ apiCommit: commits[0], webCommit: commits[1], reports: fingerprints })
  for (const [index, repo] of repos.entries()) {
    if (optionalGit(repo, 'rev-parse', '--verify', '--quiet', tagRef)) continue
    writeFileSync(receiptPath(repo), JSON.stringify({ commit: commits[index], message }) + '\n')
    git(repo, 'tag', '-a', tag, commits[index], '-m', message)
  }
  console.log('Tags locais verificadas. Pareceres em ' + out)
}

try {
  const [action, frontPath, evidencePath] = process.argv.slice(2)
  if (action === 'hook') {
    guard(frontPath)
  } else {
    if (!frontPath || (action !== 'install' && (action !== 'release' || !evidencePath))) {
      throw new Error('Uso: npm run release:practice -- install <frontend> ou release <frontend> <pasta-de-evidencias>')
    }
    const front = resolve(frontPath)
    install([api, front])
    if (action === 'release') release(front, resolve(evidencePath))
    else console.log('Proteção local instalada nos dois repositórios.')
  }
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
