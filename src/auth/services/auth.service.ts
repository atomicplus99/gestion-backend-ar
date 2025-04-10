import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { LoginDto } from '../dto/login.dto';
import { UsuarioService } from 'src/entities/usuario/usuario.service';
import * as bcrypt from 'bcrypt';
import { JwtDefaultService } from './jwt.service';
import { JwtPayload } from 'jsonwebtoken';
import { JwtCookieService } from './jwt-cookie.service';
import { JwtService } from '@nestjs/jwt';
import { Response as ExpressResponse, Response } from 'express'; 

@Injectable()
export class AuthService {

    constructor( 
                private readonly usuarioService: UsuarioService,
                private readonly jwtService: JwtDefaultService,
                private readonly jwtCookieService:JwtCookieService,
                private readonly jwtServiceCore: JwtService
            ){}

    async login(user: LoginDto){
       const userFind = await this.usuarioService.findOneByUsername(user.username);
       if(!userFind){
            throw new UnauthorizedException('Usuario no encontrado');
       }

        const isPasswordValid = await bcrypt.compare(user.password, userFind?.password_user);

        if(!isPasswordValid){
            throw new UnauthorizedException('Contraseña incorrecta');
        }

       

        return this.jwtService.generateToken({ idUser: userFind.id_user,
                                         username: userFind.nombre_usuario,
                                         userRole: userFind.rol_usuario,
                                         profile_image: userFind.profile_image,
                                        });


    }

    async handleLogin(loginDto: LoginDto, res: Response) {
      const accessToken = await this.login(loginDto);
      this.jwtCookieService.setAuthCookie(res, accessToken);
      const payload = this.jwtServiceCore.verify(accessToken);
      const userProfile = await this.getProfileDetails(payload);
    
      return {
        message: 'Inicio de sesión exitoso',
        user: userProfile,
      };
    }



    async getProfileDetails(payload: JwtPayload) {
      const usuario = await this.usuarioService.findByIdWithRelations(payload.idUser);
    
      if (!usuario) throw new NotFoundException('Usuario no encontrado');
    
      let nombreCompleto = 'Desconocido';
    
      if (usuario.alumno) {
        nombreCompleto = `${usuario.alumno.nombre} ${usuario.alumno.apellido}`;
      } else if (usuario.auxiliar) {
        nombreCompleto = `${usuario.auxiliar.nombre} ${usuario.auxiliar.apellido}`;
      }
    
      return {
        username: usuario.nombre_usuario,
        role: usuario.rol_usuario,
        photo: usuario.profile_image,
        nombreCompleto,
      };
    }
    
      



}
