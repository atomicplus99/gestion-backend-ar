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

        const isPasswordValid = await bcrypt.compare(user.password, userFind?.password_user);

        if(!isPasswordValid){
            throw new UnauthorizedException('Contraseña incorrecta');
        }

        return this.jwtService.generateToken({ 
            idUser: userFind.id_user,
            username: userFind.nombre_usuario,
            userRole: userFind.rol_usuario,
            profile_image: userFind.profile_image,
        });
    }

    async handleLogin(loginDto: LoginDto, res: Response) {
      const accessToken = await this.login(loginDto);
      const payload = this.jwtServiceCore.verify(accessToken);
      const userProfile = await this.getProfileDetails(payload);
    
      return {
        message: 'Inicio de sesión exitoso',
        access_token: accessToken,
        user: userProfile,
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
        console.error('Payload inválido:', payload);
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
          console.error('Rol de usuario no reconocido:', userPayload.userRole);
          return response;
      }
      
      // Si no se encontró la entidad correspondiente, retorna solo datos básicos
      console.warn(`No se encontró ${userPayload.userRole.toLowerCase()} para el usuario:`, userPayload.idUser);
      return response;
    }
    
      



}
