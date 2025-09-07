import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private logErrorToFile(error: any, request: Request, status: number): void {
    try {
      const timestamp = new Date();
      const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = timestamp.toTimeString().split(' ')[0]; // HH:MM:SS
      
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, `errors-${dateStr}.txt`);
      
      const errorInfo = {
        timestamp: `${dateStr} ${timeStr}`,
        method: request.method,
        url: request.url,
        statusCode: status,
        userAgent: request.get('User-Agent') || 'Unknown',
        ip: request.ip || request.connection.remoteAddress || 'Unknown',
        error: {
          name: error?.name || 'Unknown Error',
          message: error?.message || 'No message available',
          stack: error?.stack || 'No stack trace available'
        }
      };
      
      const logEntry = `
==========================================
ERROR DEL SERVIDOR
==========================================
Fecha y Hora: ${errorInfo.timestamp}
Método: ${errorInfo.method}
URL: ${errorInfo.url}
Código de Estado: ${errorInfo.statusCode}
IP del Cliente: ${errorInfo.ip}
User Agent: ${errorInfo.userAgent}
------------------------------------------
Error:
Nombre: ${errorInfo.error.name}
Mensaje: ${errorInfo.error.message}
Stack Trace:
${errorInfo.error.stack}
==========================================

`;
      
      fs.appendFileSync(logFile, logEntry, 'utf8');
      
    } catch (logError) {
      this.logger.error('Error al escribir en el archivo de log:', logError);
    }
  }

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

    // Log del error a archivo
    this.logErrorToFile(exception, request, status);

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
