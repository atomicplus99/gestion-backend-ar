import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';  // Importa DataSource
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  console.log('🚀 [Main] Iniciando aplicación...');
  const app = await NestFactory.create(AppModule);
  console.log('✅ [Main] Aplicación creada exitosamente');
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  console.log('✅ [Main] Container configurado');
  const config = new DocumentBuilder()
    .setTitle('API Colegio')
    .setDescription('Descripcion de los endpoints de colegio en general')
    .setVersion('1.0')
    .addTag('alumno')
    .addTag('turno')
    .addTag('usuario')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  
  app.enableCors({
    origin: true, // Permite todos los orígenes
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  
  console.log('🌐 [Main] CORS configurado para múltiples orígenes');

  app.use(cookieParser());

  // Middleware de logging simplificado
  app.use((req, res, next) => {
    console.log(`🌐 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })); 
  
  // Aplicar filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // Aplicar interceptor global de transformación de respuestas
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  
  console.log('🌐 [Main] Iniciando servidor en puerto 3000...');
  await app.listen(3000, 'localhost');
  console.log('✅ [Main] Servidor iniciado exitosamente en http://localhost:3000');
  console.log('📚 [Main] Documentación Swagger disponible en http://localhost:3000/api');
}
bootstrap();
