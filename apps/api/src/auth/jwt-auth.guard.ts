import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from './current-user';

type AuthRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, role: true, status: true },
      });
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account is unavailable');
      }
      request.user = { sub: user.id, email: user.email, role: user.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid, expired, or inactive account');
    }
  }
}