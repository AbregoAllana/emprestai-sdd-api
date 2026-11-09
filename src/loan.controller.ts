import { BadRequestException, ConflictException, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { AuthenticatedRequest } from './auth.guard'
import { AuthGuard } from './auth.guard'
import { PrismaService } from './prisma.service'

const loanDays = 15
const loanLimit = 3
const attempts = 3

export function loanDueDate(borrowedAt: Date) {
  const dueAt = new Date(borrowedAt)
  dueAt.setUTCDate(dueAt.getUTCDate() + loanDays)
  return dueAt
}

@Controller('loans')
@UseGuards(AuthGuard)
export class LoanController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('mine')
  listMine(@Req() request: AuthenticatedRequest) {
    return this.prisma.loan.findMany({
      where: { tenantId: request.user.tenantId, borrowerUserId: request.user.id, returnedAt: null },
      orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
      select: { id: true, dueAt: true, equipment: { select: { id: true, name: true, assetTag: true } } },
    })
  }

  @Post(':equipmentId')
  async borrow(@Param('equipmentId', ParseUUIDPipe) equipmentId: string, @Req() request: AuthenticatedRequest) {
    const { tenantId, id: borrowerUserId } = request.user
    const borrower = { tenantId, borrowerUserId, returnedAt: null }

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await this.prisma.$transaction(async (transaction) => {
          const equipment = await transaction.equipment.findFirst({
            where: { id: equipmentId, tenantId, condition: 'AVAILABLE', loans: { none: { returnedAt: null } } },
            select: { id: true },
          })
          if (!equipment) throw new ConflictException('Equipamento indisponível')

          const borrowedAt = new Date()
          if (await transaction.loan.count({ where: { ...borrower, dueAt: { lt: borrowedAt } } })) {
            throw new ConflictException('Há empréstimo em atraso')
          }
          if (await transaction.loan.count({ where: borrower }) >= loanLimit) {
            throw new ConflictException('Limite de 3 empréstimos em aberto atingido')
          }

          return transaction.loan.create({
            data: { tenantId, equipmentId, borrowerUserId, borrowedAt, dueAt: loanDueDate(borrowedAt) },
            select: { id: true, equipmentId: true, dueAt: true },
          })
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError)) throw error
        if (error.code === 'P2002') throw new ConflictException('Equipamento indisponível')
        if (error.code !== 'P2034') throw error
        if (attempt === attempts) throw new ConflictException('Houve outra solicitação ao mesmo tempo. Tente novamente.')
      }
    }
  }

  @Post(':loanId/return')
  async returnLoan(@Param('loanId') loanId: string, @Req() request: AuthenticatedRequest) {
    const loan = await this.prisma.loan.findFirst({
      where: { id: loanId, tenantId: request.user.tenantId, borrowerUserId: request.user.id, returnedAt: null },
    })
    if (!loan) throw new BadRequestException('Empréstimo não encontrado')
    return this.prisma.loan.update({
      where: { id: loan.id },
      data: { returnedAt: new Date(), returnedByUserId: request.user.id },
    })
  }
}
