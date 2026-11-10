import { readFile } from 'node:fs/promises'
import { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'
import inventory = require('./equipment-practice.json')

const teacherEmail = 'marcelo.grilo@institutojef.org.br'
const practiceAssetTags = inventory.map((item) => item.assetTag)

class PracticeLoadError extends Error {}

const asset = z.object({
  assetTag: z.string(),
  photoId: z.number().int().positive(),
  author: z.string().trim().min(1),
  source: z.url().refine((url) => new URL(url).origin === 'https://pixabay.com'),
  license: z.literal('https://pixabay.com/service/license-summary/'),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  imagePath: z.string(),
  width: z.literal(800),
  height: z.literal(600),
})

export function validateManifest(input: unknown) {
  const photos = z.array(asset).length(inventory.length).parse(input)
  const byTag = new Map(photos.map((photo) => [photo.assetTag, photo]))
  if (
    new Set(photos.map((photo) => photo.photoId)).size !== inventory.length ||
    new Set(photos.map((photo) => photo.sha256)).size !== inventory.length
  ) throw new Error('O manifesto contém fotos repetidas')

  for (const { assetTag } of inventory) {
    if (byTag.get(assetTag)?.imagePath !== `equipment/${assetTag}.jpg`) {
      throw new Error(`Foto ausente ou caminho inválido: ${assetTag}`)
    }
  }
  return byTag
}

export async function loadPractice(transaction: Prisma.TransactionClient, photos: ReturnType<typeof validateManifest>, teacherId: string) {
  const [account] = await transaction.$queryRaw<{ matches: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE id = ${teacherId}::uuid AND lower(email) = ${teacherEmail}
    ) AS matches
  `
  if (!account.matches) {
    throw new PracticeLoadError('O UUID informado não corresponde ao e-mail do professor no Supabase Auth.')
  }
  const previousLoan = await transaction.loan.findFirst({
    where: { borrowerUserId: teacherId },
    select: { id: true },
  })
  if (previousLoan) {
    throw new PracticeLoadError('A conta do professor já tem empréstimos registrados. Confira a conta antes de repetir a carga.')
  }

  const tenant = await transaction.tenant.upsert({
    where: { slug: 'suporte_ti' },
    update: {},
    create: { slug: 'suporte_ti', name: 'Suporte de TI' },
  })
  const unexpectedEquipment = await transaction.equipment.findFirst({
    where: {
      tenantId: tenant.id,
      OR: [{ assetTag: null }, { assetTag: { notIn: practiceAssetTags } }],
    },
    select: { id: true },
  })
  if (unexpectedEquipment) {
    throw new PracticeLoadError('O tenant da prática tem equipamento fora da lista canônica. Confira o inventário antes de repetir a carga.')
  }

  await transaction.membership.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: teacherId } },
    update: { role: 'COLLABORATOR' },
    create: { tenantId: tenant.id, userId: teacherId, role: 'COLLABORATOR' },
  })

  for (const item of inventory) {
    const imagePath = photos.get(item.assetTag)!.imagePath
    await transaction.$executeRaw`
      INSERT INTO equipment (id, tenant_id, name, category, asset_tag, condition, image_path, updated_at)
      VALUES (gen_random_uuid(), ${tenant.id}::uuid, ${item.name}, ${item.category}::equipment_category,
              ${item.assetTag}, ${item.condition}::equipment_condition, ${imagePath}, now())
      ON CONFLICT (tenant_id, asset_tag) WHERE asset_tag IS NOT NULL
      DO UPDATE SET name = EXCLUDED.name, category = EXCLUDED.category,
                    condition = EXCLUDED.condition, image_path = EXCLUDED.image_path, updated_at = now()
      WHERE (equipment.name, equipment.category, equipment.condition, equipment.image_path)
         IS DISTINCT FROM (EXCLUDED.name, EXCLUDED.category, EXCLUDED.condition, EXCLUDED.image_path)
    `
  }
}

async function main() {
  const teacherId = z.uuid().parse(process.env.PRACTICE_TEACHER_USER_ID)
  const path = process.env.PRACTICE_PHOTO_MANIFEST
  if (!path) throw new Error('Informe PRACTICE_PHOTO_MANIFEST')
  const photos = validateManifest(JSON.parse((await readFile(path, 'utf8')).replace(/^﻿/, '')))
  const prisma = new PrismaClient()
  try {
    await prisma.$transaction(
      (transaction) => loadPractice(transaction, photos, teacherId),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30_000 },
    )
    console.log('Carga da prática aplicada.')
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    const message = error instanceof PracticeLoadError
      ? error.message
      : 'Confira o manifesto, o UUID Auth e a configuração do banco.'
    console.error('Carga interrompida. ' + message)
    process.exitCode = 1
  })
}
