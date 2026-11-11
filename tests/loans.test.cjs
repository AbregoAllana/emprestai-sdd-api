jest.mock('../dist/src/auth.guard', () => ({ AuthGuard: class AuthGuard {} }))

const { randomUUID } = require('node:crypto')
const { PrismaClient } = require('@prisma/client')
const { LoanController, loanDueDate } = require('../dist/src/loan.controller')
const { EquipmentController } = require('../dist/src/equipment.controller')

test('003/CA-02 acrescenta exatamente 14 dias corridos, incluindo fim de semana e virada de mês', () => {
  expect(loanDueDate(new Date('2026-10-30T15:00:00Z')).toISOString()).toBe('2026-11-13T15:00:00.000Z')
})

const database = process.env.PRACTICE_TEST_DATABASE_URL
const local = database && new URL(database)
if (local && (!['localhost', '127.0.0.1'].includes(local.hostname) || local.pathname !== '/emprestai_sdd')) {
  throw new Error('Os testes exigem o PostgreSQL local descartável emprestai_sdd')
}
const integration = local ? describe : describe.skip
integration('PostgreSQL da prática', () => {
  const prisma = local ? new PrismaClient({ datasourceUrl: database }) : null
  const loans = new LoanController(prisma)
  let tenant
  let otherTenant
  let first
  let second
  let other
  const users = [randomUUID(), randomUUID(), randomUUID()]

  beforeAll(async () => {
    tenant = await prisma.tenant.create({ data: { slug: randomUUID(), name: 'Teste' } })
    otherTenant = await prisma.tenant.create({ data: { slug: randomUUID(), name: 'Outro tenant' } })
    for (const user of users) await prisma.$executeRaw`INSERT INTO auth.users (id) VALUES (${user}::uuid)`
    first = { user: { id: users[0], tenantId: tenant.id } }
    second = { user: { id: users[1], tenantId: tenant.id } }
    other = { user: { id: users[2], tenantId: otherTenant.id } }
  })
  afterEach(async () => {
    const scope = { tenantId: { in: [tenant.id, otherTenant.id] } }
    await prisma.loan.deleteMany({ where: scope })
    await prisma.equipment.deleteMany({ where: scope })
  })
  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant.id, otherTenant.id] } } })
    for (const user of users) await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${user}::uuid`
    await prisma.$disconnect()
  })

  function equipment(owner = first, condition = 'AVAILABLE') {
    return prisma.equipment.create({ data: { tenantId: owner.user.tenantId, name: 'Notebook', category: 'NOTEBOOK', condition } })
  }
  async function open(item, request, dueAt = new Date('2099-12-01T12:00:00Z'), returnedAt = null) {
    const borrowedAt = new Date(Math.min(dueAt.getTime(), returnedAt?.getTime() ?? Date.now()) - 86400000)
    return prisma.loan.create({
      data: { tenantId: request.user.tenantId, borrowerUserId: request.user.id, equipmentId: item.id,
        borrowedAt, dueAt, returnedAt, returnedByUserId: returnedAt ? request.user.id : null },
    })
  }
  async function existing(count) {
    for (let index = 0; index < count; index++) await open(await equipment(), first)
  }

  test('003/CA-01 e CA-02 grava o empréstimo, muda disponibilidade e omite identidade', async () => {
    const item = await equipment()
    const loan = await loans.borrow(item.id, first)
    const persisted = await prisma.loan.findUniqueOrThrow({ where: { id: loan.id } })
    expect(persisted.dueAt.getTime() - persisted.borrowedAt.getTime()).toBe(14 * 86400000)
    const [listed] = await new EquipmentController(prisma).list(first)
    expect(listed.borrowed).toBe(true)
    expect(listed).not.toHaveProperty('borrowerUserId')
    expect(listed).not.toHaveProperty('loans')
  })

  test('003/CA-03 recusa manutenção, equipamento de outro tenant e equipamento ocupado', async () => {
    const held = await equipment()
    await open(held, second)
    const maintenance = await equipment(first, 'MAINTENANCE')
    const outside = await equipment(other)
    for (const item of [held, maintenance, outside]) {
      await expect(loans.borrow(item.id, first)).rejects.toMatchObject({ status: 409, message: 'Equipamento indisponível' })
    }
  })

  test('003/CA-03 recusa o quarto e informa o limite', async () => {
    await existing(3)
    await expect(loans.borrow((await equipment()).id, first)).rejects.toThrow('Limite de 3 empréstimos')
  })

  test('003/CA-03 recusa por atraso mesmo abaixo do limite', async () => {
    await open(await equipment(), first, new Date('2000-01-01T00:00:00Z'))
    await expect(loans.borrow((await equipment()).id, first)).rejects.toThrow('Há empréstimo em atraso')
  })

  test('003/CA-04 dois pedidos pelo mesmo equipamento criam exatamente um empréstimo', async () => {
    const item = await equipment()
    const results = await Promise.allSettled([loans.borrow(item.id, first), loans.borrow(item.id, second)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find((result) => result.status === 'rejected').reason.status).toBe(409)
    expect(await prisma.loan.count({ where: { equipmentId: item.id } })).toBe(1)
  })

  test('003/CA-04 dois pedidos diferentes no limite só criam o terceiro', async () => {
    await existing(2)
    const [a, b] = await Promise.all([equipment(), equipment()])
    const results = await Promise.allSettled([loans.borrow(a.id, first), loans.borrow(b.id, first)])
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)
    expect(results.find((result) => result.status === 'rejected').reason.status).toBe(409)
    expect(await prisma.loan.count({ where: { borrowerUserId: first.user.id, returnedAt: null } })).toBe(3)
  })

  test('003/CA-05 omite devolvidos, outros usuários e outros tenants', async () => {
    const mine = await open(await equipment(), first)
    await open(await equipment(), first, mine.dueAt, new Date())
    await open(await equipment(), second)
    await open(await equipment(other), { user: { id: first.user.id, tenantId: otherTenant.id } })
    expect(await loans.listMine(first)).toEqual([expect.objectContaining({ id: mine.id, dueAt: mine.dueAt })])
  })
})
