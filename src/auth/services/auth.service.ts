import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { LoginDto } from '../dto/login.dto';
import { UsuarioService } from 'src/entities/usuario/services/usuario.service';
import * as bcrypt from 'bcrypt';
import { JwtDefaultService } from './jwt.service';
import { JwtService } from '@nestjs/jwt';
import { Response as ExpressResponse, Response } from 'express';

@Injectable()
export class AuthService {

    constructor( 
                private readonly usuarioService: UsuarioService,
                private readonly jwtService: JwtDefaultService,
                private readonly jwtServiceCore: JwtService
            ){}

        async login(user: LoginDto){
       const userFind = await this.usuarioService.findOneByUsername(user.username);
       if(!userFind){
            throw new UnauthorizedException('Usuario no encontrado');
       }

       // Intentar primero con bcrypt (para contraseñas hasheadas)
       let isPasswordValid = await bcrypt.compare(user.password, userFind?.password_user);
       
       // Si bcrypt falla, verificar si es texto plano
       if (!isPasswordValid && userFind?.password_user && !userFind.password_user.startsWith('$2b$')) {
           isPasswordValid = user.password === userFind.password_user;
       }

       if(!isPasswordValid){
            throw new UnauthorizedException('Contraseña incorrecta');
       }

        const payload = { 
            idUser: userFind.id_user,
            username: userFind.nombre_usuario,
            userRole: userFind.rol_usuario,
            profile_image: userFind.profile_image,
        };
        
        const access_token = this.jwtService.generateToken(payload);
        
        return {
            success: true,
            message: 'Autenticación exitosa',
            data: {
                access_token,
                user: payload
            }
        };
    }



    async handleLogin(loginDto: LoginDto, res: Response) {
      const loginResult = await this.login(loginDto);
      const payload = this.jwtService.verifyToken(loginResult.data.access_token);
      const userProfile = await this.getProfileDetails(payload);
    
      return {
        success: true,
        message: 'Inicio de sesión exitoso',
        data: {
          access_token: loginResult.data.access_token,
          user: userProfile,
        }
      };
    }





    async getProfileDetails(payload: any) {
      // Extrae el payload del JWT
      let userPayload;
      
      if (payload.user) {
        // Es un objeto request (desde el guard)
        userPayload = payload.user;
      } else if (payload.idUser) {
        // Es un payload JWT directo
        userPayload = payload;
      } else {
        throw new Error('Payload de autenticación inválido');
      }
      
      // Construye respuesta base con datos del JWT
      const response = {
        idUser: userPayload.idUser,
        username: userPayload.username,
        role: userPayload.userRole,
        photo: userPayload.profile_image,
      };
      
      // Consulta solo la entidad correspondiente al rol
      switch (userPayload.userRole) {
        case 'AUXILIAR':
          const auxiliar = await this.usuarioService.findAuxiliarByUserId(userPayload.idUser);
          if (auxiliar) {
            return {
              ...response,
              auxiliar: {
                id_auxiliar: auxiliar.id_auxiliar,
                nombre: auxiliar.nombre,
                apellido: auxiliar.apellido,
                correo_electronico: auxiliar.correo_electronico,
                telefono: auxiliar.telefono,
              }
            };
          }
          break;
          
        case 'ALUMNO':
          const alumno = await this.usuarioService.findAlumnoByUserId(userPayload.idUser);
          if (alumno) {
            return {
              ...response,
              alumno: {
                id_alumno: alumno.id_alumno,
                nombre: alumno.nombre,
                apellido: alumno.apellido,
                codigo: alumno.codigo,
                grado: alumno.grado,
                seccion: alumno.seccion,
              }
            };
          }
          break;
          
        case 'DIRECTOR':
          const director = await this.usuarioService.findDirectorByUserId(userPayload.idUser);
          if (director) {
            return {
              ...response,
              director: {
                id_director: director.id_director,
                nombres: director.nombres,
                apellidos: director.apellidos,
                email: director.email,
                telefono: director.telefono,
                direccion: director.direccion,
              }
            };
          }
          break;
          
        case 'ADMINISTRADOR':
          const administrador = await this.usuarioService.findAdministradorByUserId(userPayload.idUser);
          if (administrador) {
            return {
              ...response,
              administrador: {
                id_administrador: administrador.id_administrador,
                nombres: administrador.nombres,
                apellidos: administrador.apellidos,
                email: administrador.email,
                telefono: administrador.telefono,
                direccion: administrador.direccion,
              }
            };
          }
          break;
          
        case 'ADMIN':
          // Admin solo retorna datos básicos del usuario
          return response;
          
        default:
          return response;
      }
      
      // Si no se encontró la entidad correspondiente, retorna solo datos básicos
      return response;
    }
    
      



}
