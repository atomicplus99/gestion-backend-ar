import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { JwtService } from '@nestjs/jwt';


@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService) { }


    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res() res: Response) {
        try {
            const loginResult = await this.authService.handleLogin(loginDto, res);
            return res.json(loginResult);
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: 'Credenciales incorrectas',
                error: error.message 
            });
        }
    }


    @Get('me')
    me(@Req() req: any) {
      // Endpoint para obtener información del usuario (requiere JWT en header)
      if (!req.user) {
        return { 
          statusCode: 401, 
          message: 'No autorizado. Token requerido.',
          error: 'Unauthorized'
        };
      }
      
      try {
        return this.authService.getProfileDetails(req.user);
      } catch (error) {
        console.error('❌ [AuthController] Error en /auth/me:', error);
        return {
          statusCode: 500,
          message: 'Error interno del servidor',
          error: 'Internal Server Error'
        };
      }
    }

    @Get('test')
    test(@Req() req: any) {
      console.log('🔐 [AuthController] Endpoint de prueba llamado');
      return {
        message: 'Endpoint de prueba funcionando correctamente',
        timestamp: new Date().toISOString()
      };
    }

    @Post('logout')
    logout(@Res() res: Response) {
        return res.status(200).json({ message: "Sesion cerrada correctamente" });
    }




}
