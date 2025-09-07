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
    
    
    const now = new Date().toISOString();
    
    return next.handle().pipe(
      map(data => {
        
        if (data && typeof data === 'object') {
          try {
          } catch (error) {
          }
          
          // Si la respuesta ya está estructurada, no la transformamos
          if ('success' in data) {
            return data;
          }
        }
        
        
        // Transformar respuesta exitosa al formato estructurado
        const transformedResponse = {
          success: true,
          message: 'Operación exitosa',
          timestamp: now,
          data: data
        };
        
        
        return transformedResponse;
      }),
    );
  }
}
