import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ArcjetGuard, ArcjetModule,
  detectBot,
  shield,
  tokenBucket,
} from '@arcjet/nest';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ArcjetModule.forRoot({
      isGlobal: true,
      key: process.env.ARCJET_KEY || "ajkey_yourkey",
      rules: [
        // Shield protects your app from common attacks e.g. SQL injection
        shield({ mode: "LIVE" }),
        // Create a bot detection rule
        detectBot({
          mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
          // Block all bots except the following
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
            // Uncomment to allow these other common bot categories
            // See the full list at https://arcjet.com/bot-list
            //"CATEGORY:MONITOR", // Uptime monitoring services
            //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
          ],
        }),
        // tokenBucket({
        //   mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
        //   refillRate: 5, // refill 5 tokens per interval
        //   interval: 10, // refill every 10 seconds
        //   capacity: 10, // bucket maximum capacity of 10 tokens
        // }),
      ]
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/your-db',
    ),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ArcjetGuard,
  }],
})
export class AppModule { }
