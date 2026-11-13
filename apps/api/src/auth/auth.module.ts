import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MeController } from './me.controller';
import { ProfileController } from '../profile/profile.controller';
import { ProfileService } from '../profile/profile.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_ACCESS_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error('JWT_ACCESS_SECRET must contain at least 32 characters');
        }
        return {
          secret,
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m'),
            issuer: 'zyvon-ai',
            audience: 'zyvon-clients',
          },
          verifyOptions: {
            issuer: 'zyvon-ai',
            audience: 'zyvon-clients',
          },
        };
      },
    }),
  ],
  controllers: [AuthController, MeController, ProfileController],
  providers: [AuthService, JwtAuthGuard, ProfileService],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
