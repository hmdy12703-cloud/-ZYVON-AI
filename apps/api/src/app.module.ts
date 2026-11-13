import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ExercisesModule } from './exercises/exercises.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { PlansModule } from './plans/plans.module';
import { CoachModule } from './coach/coach.module';
import { NutritionModule } from './nutrition/nutrition.module';
import { AdminModule } from './admin/admin.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ExercisesModule,
    WorkoutsModule,
    PlansModule,
    CoachModule,
    NutritionModule,
    AdminModule,
    FeedbackModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
