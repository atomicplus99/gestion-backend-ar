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

    this.logger.log(`🚨 [Filter] Capturando excepción en ${request.method} ${request.url}`);
    this.logger.log(`📊 [Filter] Tipo de excepción: ${exception?.constructor?.name || 'Unknown'}`);
    this.logger.log(`📊 [Filter] Mensaje de excepción: ${exception instanceof Error ? exception.message : String(exception)}`);

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
      
      this.logger.log(`📊 [Filter] Excepción HTTP con status: ${status}`);
      this.logger.log(`📊 [Filter] Cuerpo de respuesta: ${JSON.stringify(responseBody)}`);
      
      if (typeof responseBody === 'object' && responseBody !== null) {
        message = (responseBody as any).message || exception.message;
        error = (responseBody as any).error || exception.message;
        
        this.logger.log(`📊 [Filter] Mensaje extraído: ${message}`);
        this.logger.log(`📊 [Filter] Error extraído: ${error}`);
        
        // Manejar errores de validación específicamente
        if (status === HttpStatus.BAD_REQUEST && (responseBody as any).message?.includes('Validation failed')) {
          error = 'VALIDATION_ERROR';
          this.logger.log(`🔄 [Filter] Detectado error de validación, cambiando error a: ${error}`);
          
          // Extraer errores de validación si están disponibles
          if ((responseBody as any).errors) {
            errors = (responseBody as any).errors.map((err: any) => ({
              field: err.property,
              value: err.value,
              message: Object.values(err.constraints || {}).join(', ')
            }));
            this.logger.log(`📊 [Filter] Errores de validación extraídos: ${JSON.stringify(errors)}`);
          }
        }
      } else {
        message = exception.message;
        error = exception.message;
        this.logger.log(`📊 [Filter] Usando mensaje directo de excepción: ${message}`);
      }
      
      // Manejar errores específicos
      if (status === HttpStatus.NOT_FOUND) {
        error = 'ALUMNO_NOT_FOUND';
        this.logger.log(`🔄 [Filter] Error 404 detectado, cambiando error a: ${error}`);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      this.logger.log(`📊 [Filter] Excepción de Error estándar: ${error} - ${message}`);
      
      // Detectar errores de conectividad específicos
      if (exception.message.includes('ECONNREFUSED') || 
          exception.message.includes('ENOTFOUND') ||
          exception.message.includes('timeout')) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Servicio no disponible. Verifica la conectividad.';
        error = 'Service Unavailable';
        this.logger.log(`🔄 [Filter] Error de conectividad detectado, cambiando status a: ${status}`);
      }
    } else {
      this.logger.warn(`⚠️ [Filter] Tipo de excepción desconocido: ${typeof exception}`);
      this.logger.warn(`⚠️ [Filter] Valor de excepción: ${JSON.stringify(exception)}`);
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

    this.logger.log(`📤 [Filter] Enviando respuesta de error:`);
    this.logger.log(`   - Status: ${status}`);
    this.logger.log(`   - Success: ${errorResponse.success}`);
    this.logger.log(`   - Message: ${errorResponse.message}`);
    this.logger.log(`   - Error: ${errorResponse.error}`);
    this.logger.log(`   - Timestamp: ${errorResponse.timestamp}`);

    response.status(status).json(errorResponse);
  }
}
