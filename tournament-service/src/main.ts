import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? '1'));
  app.use(helmet());
  app.enableCors({ origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean) });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const port = Number(process.env.PORT ?? '3100');
  await app.listen(port);
  Logger.log(`Tournament service listening on :${port}`, 'Bootstrap');
}

void bootstrap();
