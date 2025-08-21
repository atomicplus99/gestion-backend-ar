import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'Backend funcionando correctamente',
      uptime: process.uptime()
    };
  }

  @Get('test-cors')
  testCors() {
    return {
      message: 'CORS funcionando correctamente',
      timestamp: new Date().toISOString(),
      cors: 'enabled',
      origin: 'all'
    };
  }

  @Post('test-post')
  testPost() {
    return {
      message: 'POST funcionando correctamente',
      timestamp: new Date().toISOString(),
      method: 'POST',
      cors: 'enabled'
    };
  }

  @Get('ping')
  ping() {
    return {
      success: true,
      message: '¡Pong! Backend conectado correctamente',
      timestamp: new Date().toISOString(),
      status: 'OK',
      cors: 'enabled',
      origin: 'all',
      backend: 'NestJS',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Post('ping')
  pingPost() {
    return {
      success: true,
      message: '¡Pong! POST funcionando correctamente',
      timestamp: new Date().toISOString(),
      method: 'POST',
      status: 'OK',
      cors: 'enabled',
      origin: 'all',
      backend: 'NestJS',
      version: '1.0.0'
    };
  }

  @Get('test')
  test() {
    return {
      success: true,
      message: 'Endpoint de prueba funcionando correctamente',
      timestamp: new Date().toISOString(),
      status: 'OK'
    };
  }

  @Get('test-connection')
  testConnection() {
    return {
      success: true,
      message: 'Conexión exitosa al backend',
      timestamp: new Date().toISOString(),
      status: 'OK',
      cors: 'enabled',
      origin: 'all',
      endpoints: {
        health: '/health',
        ping: '/ping',
        test: '/test',
        auth: '/auth/*',
        turno: '/turno',
        alumnos: '/alumnos/*'
      },
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    };
  }
}
