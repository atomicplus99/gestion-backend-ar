import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';

    // Log detallado del error para debugging
    this.logger.error(
      `Error en ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      
      if (typeof responseBody === 'object' && responseBody !== null) {
        message = (responseBody as any).message || exception.message;
        error = (responseBody as any).error || exception.message;
      } else {
        message = exception.message;
        error = exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      
      // Detectar errores de conectividad específicos
      if (exception.message.includes('ECONNREFUSED') || 
          exception.message.includes('ENOTFOUND') ||
          exception.message.includes('timeout')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Servicio no disponible. Verifica la conectividad.';
        error = 'Service Unavailable';
      }
    }

    // Respuesta estructurada con más información para debugging
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      // Información adicional para debugging
      details: {
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        host: request.headers.host,
      }
    };

    response.status(status).json(errorResponse);
  }
}
