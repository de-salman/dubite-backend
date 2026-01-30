import { ExpressAdapter } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import express, { Request, Response } from 'express';
import type { Express } from 'express';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

export class AppFactory {
  static create(): {
    appPromise: Promise<INestApplication>;
    expressApp: Express;
  } {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const appPromise = NestFactory.create(AppModule, adapter);

    appPromise
      .then((app) => {
        app.enableCors({
          origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
          methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
          credentials: true,
        });
        app.useGlobalPipes(
          new ValidationPipe({
            whitelist: true,
          }),
        );
      })
      .catch((err) => {
        throw err;
      });

    // Middleware: wait for NestJS app to be ready before handling requests (init once)
    expressApp.use((req: Request, res: Response, next) => {
      appPromise
        .then(async (app) => {
          await app.init();
          next();
        })
        .catch((err) => next(err));
    });

    return { appPromise, expressApp };
  }
}
