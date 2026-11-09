const { randomUUID } = require('node:crypto')
const { PrismaClient } = require('@prisma/client')
const { loadPractice, validateManifest } = require('../dist/prisma/seed')
const inventory = require('../prisma/equipment-practice.json')
const professorEmail = 'marcelo.grilo@institutojef.org.br'

function testPhotos() {
  return inventory.map(({ assetTag }, index) => ({
    assetTag, photoId: index + 1, author: 'Fixture local', source: 'https://pixabay.com/photos/local-fixture/',
    license: 'https://pixabay.com/service/license-summary/', sha256: (index + 1).toString(16).padStart(64, '0'),
    imagePath: 'equipment/' + assetTag + '.jpg', width: 800, height: 600,
  }))
}

test('002/CA-01 mantém lista exata e 9 disponíveis', () => {
  expect(inventory.map((item) => item.assetTag)).toEqual(Array.from({ length: 12 }, (_, index) => 'TI-' + String(index + 1).padStart(4, '0')))
  expect(inventory.filter((item) => item.condition === 'MAINTENANCE').map((item) => item.assetTag)).toEqual(['TI-0004', 'TI-0007', 'TI-0010'])
  expect(inventory.filter((item) => item.condition === 'AVAILABLE')).toHaveLength(9)
})

test('002/CA-02 valida dimensões, origem, caminho e duplicatas no manifesto', () => {
  expect(validateManifest(testPhotos()).size).toBe(12)
  for (const patch of [{ width: 799 }, { photoId: 2 }, { imagePath: 'outro.jpg' }, { source: 'https://example.com/image.jpg' }, { sha256: testPhotos()[1].sha256 }]) {
    const photos = testPhotos()
    Object.assign(photos[0], patch)
    expect(() => validateManifest(photos)).toThrow()
  }
})

const database = process.env.PRACTICE_TEST_DATABASE_URL
const local = database && new URL(database)
if (local && (!['localhost', '127.0.0.1'].includes(local.hostname) || local.pathname !== '/emprestai_sdd')) {
  throw new Error('Os testes exigem o PostgreSQL local descartável emprestai_sdd')
}

const integration = local ? test : test.skip
integration('002/CA-03 e CA-04 carga repetida mantém IDs e vínculo de colaborador e cria zero empréstimos', async () => {
  const prisma = new PrismaClient({ datasourceUrl: database })
  const teacher = randomUUID()
  try {
    await prisma.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${teacher}::uuid, ${professorEmail})`
    const photos = validateManifest(testPhotos())
    await prisma.$transaction((tx) => loadPractice(tx, photos, teacher))
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'suporte_ti' } })
    const where = { tenantId: tenant.id }
    const list = () => prisma.equipment.findMany({ where, orderBy: { assetTag: 'asc' } })
    const first = await list()
    await prisma.$transaction((tx) => loadPractice(tx, photos, teacher))
    expect(await list()).toEqual(first)
    expect(first).toHaveLength(12)
    expect(first.map((item) => item.imagePath)).toEqual(testPhotos().map((item) => item.imagePath))
    expect(await prisma.membership.findMany({ where })).toEqual([expect.objectContaining({ userId: teacher, role: 'COLLABORATOR' })])
    expect(await prisma.loan.count({ where })).toBe(0)
  } finally {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'suporte_ti' } })
    if (tenant) {
      await prisma.equipment.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.tenant.delete({ where: { id: tenant.id } })
    }
    await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${teacher}::uuid`
    await prisma.$disconnect()
  }
})

integration('002/CA-01 e CA-03 interrompe a carga por conta errada, equipamento legado ou empréstimo anterior', async () => {
  const prisma = new PrismaClient({ datasourceUrl: database })
  const teacher = randomUUID()
  const other = randomUUID()
  const photos = validateManifest(testPhotos())
  const load = (id) => prisma.$transaction((tx) => loadPractice(tx, photos, id))
  try {
    await prisma.$executeRaw`INSERT INTO auth.users (id, email) VALUES (${teacher}::uuid, ${professorEmail.toUpperCase()}), (${other}::uuid, 'outra@example.invalid')`
    await expect(load(other)).rejects.toThrow('não corresponde ao e-mail do professor')
    expect(await prisma.tenant.findUnique({ where: { slug: 'suporte_ti' } })).toBeNull()
    await load(teacher)
    const tenant = await prisma.tenant.findUniqueOrThrow({ where: { slug: 'suporte_ti' } })
    const where = { tenantId: tenant.id }
    const list = () => prisma.equipment.findMany({ where, orderBy: { id: 'asc' } })
    const before = await list()

    for (const assetTag of ['TI-9999', null]) {
      const legacy = await prisma.equipment.create({
        data: { ...where, name: 'Fixture legado', category: 'NOTEBOOK', assetTag },
      })
      const withLegacy = await list()
      await expect(load(teacher)).rejects.toThrow('equipamento fora da lista canônica')
      expect(await list()).toEqual(withLegacy)
      await prisma.equipment.delete({ where: { id: legacy.id } })
    }

    const returned = await prisma.loan.create({
      data: {
        ...where, equipmentId: before[0].id, borrowerUserId: teacher,
        borrowedAt: new Date('2026-01-01T00:00:00Z'), dueAt: new Date('2026-01-15T00:00:00Z'),
        returnedAt: new Date('2026-01-02T00:00:00Z'), returnedByUserId: teacher,
      },
    })
    await expect(load(teacher)).rejects.toThrow('já tem empréstimos registrados')
    expect(await prisma.loan.findUnique({ where: { id: returned.id } })).toEqual(returned)
    expect(await list()).toEqual(before)
    expect(await prisma.membership.count({ where })).toBe(1)
  } finally {
    const tenant = await prisma.tenant.findUnique({ where: { slug: 'suporte_ti' } })
    if (tenant) {
      const where = { tenantId: tenant.id }
      await prisma.loan.deleteMany({ where })
      await prisma.equipment.deleteMany({ where })
      await prisma.tenant.delete({ where: { id: tenant.id } })
    }
    await prisma.$executeRaw`DELETE FROM auth.users WHERE id IN (${teacher}::uuid, ${other}::uuid)`
    await prisma.$disconnect()
  }
})
