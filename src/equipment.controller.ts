import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import type { AuthenticatedRequest } from './auth.guard'
import { AuthGuard } from './auth.guard'
import { PrismaService } from './prisma.service'

@Controller('equipment')
@UseGuards(AuthGuard)
export class EquipmentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    const equipment = await this.prisma.equipment.findMany({
      where: { tenantId: request.user.tenantId },
      orderBy: [{ assetTag: 'asc' }, { id: 'asc' }],
      select: {
        id: true, name: true, category: true, assetTag: true, condition: true, notes: true, imagePath: true,
        loans: { where: { returnedAt: null }, take: 1, select: { id: true } },
      },
    })

    return equipment.map(({ loans, imagePath, ...item }) => ({
      ...item,
      borrowed: loans.length > 0,
      imageUrl: imagePath && process.env.SUPABASE_URL
        ? new URL('/storage/v1/object/public/equipment-images/' + imagePath, process.env.SUPABASE_URL).href
        : null,
    }))
  }
}
