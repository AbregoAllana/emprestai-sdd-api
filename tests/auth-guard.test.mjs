import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import guardModule from '../dist/src/auth.guard.js'

const { AuthGuard } = guardModule

test('003/CA-01 e CA-05 valida emissor, audiência e expiração antes de consultar o vínculo', async (t) => {
  const { publicKey, privateKey } = await generateKeyPair('ES256')
  const key = { ...await exportJWK(publicKey), kid: 'fixture', alg: 'ES256' }
  const server = createServer((request, response) => {
    assert.equal(request.url, '/auth/v1/.well-known/jwks.json')
    response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ keys: [key] }))
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const originalUrl = process.env.SUPABASE_URL
  t.after(async () => {
    if (originalUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = originalUrl
    await new Promise((resolve) => server.close(resolve))
  })

  const base = 'http://127.0.0.1:' + server.address().port
  const issuer = base + '/auth/v1'
  process.env.SUPABASE_URL = base + '/'
  let membershipChecks = 0
  const guard = new AuthGuard({
    membership: { findFirst: async () => {
      membershipChecks++
      return { tenantId: 'tenant-de-teste' }
    } },
  })
  const authorize = async (claims) => {
    const token = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'ES256', kid: 'fixture' }).sign(privateKey)
    const request = { headers: { authorization: 'Bearer ' + token } }
    assert.equal(await guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) }), true)
    return request.user
  }

  const now = Math.floor(Date.now() / 1000)
  const claims = { sub: 'usuario-de-teste', iss: issuer, aud: 'authenticated', exp: now + 60 }
  await assert.rejects(authorize({ ...claims, iss: 'https://outro.example.invalid/auth/v1' }), { status: 401 })
  await assert.rejects(authorize({ ...claims, aud: 'anon' }), { status: 401 })
  const { exp: _expiration, ...withoutExpiration } = claims
  await assert.rejects(authorize(withoutExpiration), { status: 401 })
  await assert.rejects(authorize({ ...claims, exp: now - 60 }), { status: 401 })
  assert.equal(membershipChecks, 0)
  assert.deepEqual(await authorize(claims), { id: claims.sub, tenantId: 'tenant-de-teste' })
  assert.equal(membershipChecks, 1)
})
