import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';  // Importa DataSource
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(AppModule);
    useContainer(app.select(AppModule), { fallbackOnErrors: true });
    
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
      allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'user-id'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    });
    

    app.use(cookieParser());

    // Middleware de logging simplificado
    app.use((req, res, next) => {
      next();
    });

    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true
    })); 
    
    // Aplicar filtro global de excepciones
    app.useGlobalFilters(new HttpExceptionFilter());
    
    // Aplicar interceptor global de transformación de respuestas
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    
    const port = 3000;
    const host = 'localhost';
    
    await app.listen(port, host);
    
    // Log de inicialización exitosa
    logger.log('==========================================');
    logger.log('SERVIDOR INICIADO EXITOSAMENTE');
    logger.log('==========================================');
    logger.log(`Puerto: ${port}`);
    logger.log(`Host: ${host}`);
    logger.log(`URL Local: http://${host}:${port}`);
    logger.log(`URL Externa: http://localhost:${port}`);
    logger.log(`Documentación API: http://${host}:${port}/api`);
    logger.log(`Base de datos: Conectada (TypeORM)`);
    logger.log(`CORS: Habilitado para todos los orígenes`);
    logger.log(`Validación: Habilitada (class-validator)`);
    logger.log(`Swagger: Configurado en /api`);
    logger.log('==========================================');
    
  } catch (error) {
    logger.error('Error al inicializar el servidor:', error);
    process.exit(1);
  }
}
bootstrap();
