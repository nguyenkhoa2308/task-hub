import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'", 'data:'],
      },
    },
  }));
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Task Hub API')
    .setDescription(
      'REST API cho Task Hub: xác thực, workspace, dự án, công việc, thành viên, bình luận, thông báo, báo cáo và thùng rác. API sử dụng HttpOnly Cookie; hãy đăng nhập bằng POST /auth/login trước khi thử các endpoint được bảo vệ.',
    )
    .setVersion('1.0')
    .addServer('https://task-hub-rftm.onrender.com', 'Production')
    .addServer('http://localhost:2308', 'Local')
    .addCookieAuth('access_token', undefined, 'access_token')
    .addCookieAuth('refresh_token', undefined, 'refresh_token')
    .addTag('Health', 'Kiểm tra trạng thái dịch vụ')
    .addTag('Authentication', 'Đăng ký, đăng nhập và quản lý tài khoản')
    .addTag('Workspaces', 'Quản lý workspace')
    .addTag('Projects', 'Quản lý dự án')
    .addTag('Tasks', 'Quản lý công việc và tệp đính kèm')
    .addTag('Members', 'Quản lý thành viên và quyền truy cập')
    .addTag('Comments', 'Bình luận, trả lời và mention')
    .addTag('Activities', 'Lịch sử hoạt động')
    .addTag('Notifications', 'Thông báo và luồng realtime')
    .addTag('Search', 'Tìm kiếm toàn cục')
    .addTag('Reports', 'Xuất báo cáo')
    .addTag('Trash', 'Khôi phục và xóa vĩnh viễn')
    .build();
  const swaggerDocument = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    jsonDocumentUrl: 'api/docs-json',
    customSiteTitle: 'Task Hub API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
    },
  });

  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT));
}
void bootstrap();
