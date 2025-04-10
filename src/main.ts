import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';  // Importa DataSource
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  })

  app.useGlobalPipes(new ValidationPipe()); 
  await app.listen(3000);
}
bootstrap();
