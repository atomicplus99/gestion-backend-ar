// jwt-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Para debugging
    const request = context.switchToHttp().getRequest();
    console.log('Token recibido:', request?.cookies?.access_token);
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Log detallado para identificar qué usuario se está extrayendo
    console.log('User extraído del token:', user);
    
    if (err || !user) {
      console.error('Error JWT Auth:', { err, info });
      throw err || new UnauthorizedException('Token no válido o expirado');
    }
    return user;
  }
}