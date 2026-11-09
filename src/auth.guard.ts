import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Request } from 'express'
import { PrismaService } from './prisma.service'

export type AuthenticatedRequest = Request & {
  user: { id: string; tenantId: string }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  private readonly supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '')
  private readonly issuer = this.supabaseUrl ? this.supabaseUrl + '/auth/v1' : null
  private readonly jwks = this.issuer
    ? createRemoteJWKSet(new URL(this.issuer + '/.well-known/jwks.json'))
    : null

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (!token || !this.jwks || !this.issuer) throw new UnauthorizedException('Sessão inválida')

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        algorithms: ['RS256', 'ES256'],
        issuer: this.issuer,
        audience: 'authenticated',
        requiredClaims: ['exp', 'sub'],
      })
      const userId = typeof payload.sub === 'string' ? payload.sub : ''
      if (!userId) throw new UnauthorizedException('Usuário ausente na sessão')
      const claimTenantId = typeof payload.tenant_id === 'string' ? payload.tenant_id : undefined
      const membership = await this.prisma.membership.findFirst({
        where: { userId, ...(claimTenantId ? { tenantId: claimTenantId } : {}) },
        orderBy: { createdAt: 'asc' },
      })
      if (!membership) throw new UnauthorizedException('Usuário sem acesso ao tenant')
      request.user = { id: userId, tenantId: membership.tenantId }
      return true
    } catch {
      throw new UnauthorizedException('Sessão inválida')
    }
  }
}
