import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ExercisesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
