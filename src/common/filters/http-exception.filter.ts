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
    let errors = null;

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
        
        
        // Manejar errores de validación específicamente
        if (status === HttpStatus.BAD_REQUEST && (responseBody as any).message?.includes('Validation failed')) {
          error = 'VALIDATION_ERROR';
          
          // Extraer errores de validación si están disponibles
          if ((responseBody as any).errors) {
            errors = (responseBody as any).errors.map((err: any) => ({
              field: err.property,
              value: err.value,
              message: Object.values(err.constraints || {}).join(', ')
            }));
          }
        }
      } else {
        message = exception.message;
        error = exception.message;
      }
      
      // Manejar errores específicos
      if (status === HttpStatus.NOT_FOUND) {
        error = 'ALUMNO_NOT_FOUND';
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
    } else {
    }

    // Respuesta estructurada según las especificaciones
    const errorResponse: any = {
      success: false,
      message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString()
    };

    // Agregar errores de validación si existen
    if (errors) {
      errorResponse.errors = errors;
    }


    response.status(status).json(errorResponse);
  }
}
