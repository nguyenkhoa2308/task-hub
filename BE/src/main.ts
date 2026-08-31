import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as dns from 'node:dns';

import { AppModule } from './app.module';

async function bootstrap() {
  // Some local/ISP DNS resolvers refuse MongoDB Atlas SRV lookups. Allow an
  // explicit resolver list in every environment and use public resolvers only
  // as a development fallback. Production keeps the host DNS by default.
  const configuredDnsServers = (process.env.DNS_SERVERS || '')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);
  const isProduction = process.env.NODE_ENV === 'production';
  const dnsServers = configuredDnsServers.length > 0
    ? configuredDnsServers
    : isProduction
      ? []
      : ['8.8.8.8', '1.1.1.1'];
  if (dnsServers.length > 0 && process.env.MONGODB_URI?.startsWith('mongodb+srv://')) {
    dns.setServers(dnsServers);
  }

  const app = await NestFactory.create(AppModule);
  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(helmet());
  app.use(cookieParser());
  app.getHttpAdapter().getInstance().set('trust proxy', isProduction ? 1 : false);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin không được phép bởi CORS'));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT));
}
void bootstrap();
