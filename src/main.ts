import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm'; // Importa DataSource
import { ValidationPipe, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import * as fs from 'fs';
import * as https from 'https';
import * as crypto from 'crypto';

// Polyfill para crypto en el entorno global
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = crypto as any;
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    let app;

    // Configuración HTTPS si está habilitado
    const httpsEnabled = process.env.HTTPS_ENABLED === 'true';
    const protocolConfig = process.env.PROTOCOL || 'http';

    if (httpsEnabled && protocolConfig === 'https') {
      const httpsOptions = {
        key: fs.readFileSync('./ssl/private-key.pem'),
        cert: fs.readFileSync('./ssl/certificate.pem'),
      };

      app = await NestFactory.create(AppModule, {
        httpsOptions,
      });

      logger.log('🔒 HTTPS habilitado con certificado SSL');
    } else {
      app = await NestFactory.create(AppModule);
      logger.log('🔓 HTTP habilitado (sin HTTPS)');
    }
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
      origin: '*', // Permite explícitamente todos los orígenes
      credentials: false, // Cambiado a false cuando origin es '*'
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Origin',
        'Accept',
        'user-id',
        'X-Requested-With',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    app.use(cookieParser());

    // Middleware de logging simplificado
    app.use((req, res, next) => {
      next();
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        skipMissingProperties: true,
        skipNullProperties: true,
        skipUndefinedProperties: true,
      }),
    );

    // Aplicar filtro global de excepciones
    app.useGlobalFilters(new HttpExceptionFilter());

    // Aplicar interceptor global de transformación de respuestas
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    const port = process.env.PORT_SERVER;
    const host = process.env.HOST;
    const protocol = process.env.PROTOCOL;

    if (!port || !host || !protocol) {
      throw new Error(
        'PORT, HOST y PROTOCOL deben estar configurados en las variables de entorno',
      );
    }

    await app.listen(port, host);

    // Log de inicialización exitosa
    logger.log('==========================================');
    logger.log('SERVIDOR INICIADO EXITOSAMENTE');
    logger.log('==========================================');
    logger.log(`Puerto: ${port}`);
    logger.log(`Host: ${host}`);
    logger.log(`Protocolo: ${protocol.toUpperCase()}`);
    logger.log(`URL Local: ${protocol}://${host}:${port}`);
    logger.log(`URL Externa: ${protocol}://localhost:${port}`);
    logger.log(`Documentación API: ${protocol}://${host}:${port}/api`);
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
