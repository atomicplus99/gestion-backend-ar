import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data?: T;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  
  private readonly logger = new Logger(ResponseTransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    this.logger.log(`🔄 [Interceptor] Procesando ${method} ${url}`);
    
    const now = new Date().toISOString();
    
    return next.handle().pipe(
      map(data => {
        this.logger.log(`📊 [Interceptor] Datos recibidos: ${data ? 'Presentes' : 'Undefined/Null'}`);
        this.logger.log(`📊 [Interceptor] Tipo de datos: ${typeof data}`);
        
        if (data && typeof data === 'object') {
          try {
            this.logger.log(`📊 [Interceptor] Propiedades del objeto: ${Object.keys(data).join(', ')}`);
          } catch (error) {
            this.logger.log(`📊 [Interceptor] Objeto con referencias circulares detectado`);
          }
          
          // Si la respuesta ya está estructurada, no la transformamos
          if ('success' in data) {
            this.logger.log(`✅ [Interceptor] Respuesta ya estructurada, no se transforma`);
            return data;
          }
        }
        
        this.logger.log(`🔄 [Interceptor] Transformando respuesta al formato estructurado`);
        
        // Transformar respuesta exitosa al formato estructurado
        const transformedResponse = {
          success: true,
          message: 'Operación exitosa',
          timestamp: now,
          data: data
        };
        
        this.logger.log(`✅ [Interceptor] Respuesta transformada exitosamente`);
        
        return transformedResponse;
      }),
    );
  }
}
