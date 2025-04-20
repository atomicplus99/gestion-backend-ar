// src/usuario/usuario.mapper.ts

import { Usuario } from './usuario.entity';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';

export class UsuarioMapper {
  
  static fromAlumnoDto(dto: RegisterAlumnoDto): Usuario {
    const u = new Usuario();

   
    const firstName  = dto.nombre.trim().split(' ')[0];
    const firstLast  = dto.apellido.trim().split(' ')[0];

    u.nombre_usuario = `${firstName.toUpperCase()}.${firstLast.toUpperCase()}`;

    const year = new Date().getFullYear();
    u.password_user = `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;

    u.rol_usuario   = RolUsuario.ALUMNO;
    u.profile_image = 'uploads/profiles/no-image.png';

    return u;
  }
}
