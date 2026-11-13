import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createIpRateLimit } from './security/ip-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? false,
    credentials: true,
  });

  // Conservative per-IP limits for public authentication endpoints.
  app.use(
    '/api/v1/auth/login',
    createIpRateLimit({
      windowMs: 15 * 60 * 1000,
      maxRequests: 10,
      message: 'محاولات تسجيل الدخول كثيرة. حاول مرة أخرى بعد انتهاء المهلة.',
    }),
  );
  app.use(
    '/api/v1/auth/register',
    createIpRateLimit({
      windowMs: 60 * 60 * 1000,
      maxRequests: 5,
      message: 'تم تجاوز عدد محاولات إنشاء الحساب. حاول مرة أخرى لاحقًا.',
    }),
  );

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
}
void bootstrap();
