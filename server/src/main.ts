import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // trust proxy MUST be configured before other middleware so client IPs (used by
  // rate limiting) are correct behind a load balancer (prompt §2, IPv6-safe).
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? '1');
  app.set('trust proxy', hops);

  app.use(helmet());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
    credentials: true,
  });

  // Reject unknown/invalid fields on every endpoint (security by default).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? '3000');
  await app.listen(port);
  Logger.log(`Progression API listening on :${port}`, 'Bootstrap');
}

void bootstrap();
