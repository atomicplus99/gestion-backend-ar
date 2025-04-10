import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { JwtCookieService } from '../services/jwt-cookie.service';
import { Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth/jwt-auth.guard';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { DataSource } from 'typeorm';
import { Usuario } from 'src/entities/usuario/usuario.entity';
import { Auxiliar } from 'src/entities/auxiliar/auxiliar.entity';
import { Alumno } from 'src/entities/alumno/alumno.entity';
import { JwtService } from '@nestjs/jwt';


@Controller('auth')
export class AuthController {

    constructor(private readonly authService: AuthService,
        private readonly jwtCookieService: JwtCookieService,
    ) { }


    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res() res: Response) {
        try {
            const loginResult = await this.authService.handleLogin(loginDto, res);
            return res.json(loginResult);
          } catch (error) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
          }
    }


    @Get('me')
    @UseGuards(JwtAuthGuard)
    me(@Req() req: any) {
        return this.authService.getProfileDetails(req as JwtPayload);
    }

    @Post('logout')
    logout(@Res() res: Response) {
        this.jwtCookieService.clearCookie(res);
        return res.status(200).json({ message: "Sesion cerrada correctamente" });
    }




}
