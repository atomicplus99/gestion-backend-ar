// src/usuario/usuario.mapper.ts

import { Usuario } from './usuario.entity';
import { RolUsuario } from '../../common/enums/rol-usuario.enum';
import { CreateAlumnoDto } from 'src/auth/dto/users/create-alumno.dto';
import { RegisterAlumnoDto } from 'src/auth/dto/alumno/registers/alumno-create.dto';
import * as bcrypt from 'bcrypt';

export class UsuarioMapper {
  
  static async fromAlumnoDto(dto: RegisterAlumnoDto): Promise<Usuario> {
    const u = new Usuario();

   
    const firstName  = dto.nombre.trim().split(' ')[0];
    const firstLast  = dto.apellido.trim().split(' ')[0];

    u.nombre_usuario = `${firstName.toUpperCase()}.${firstLast.toUpperCase()}`;

    const year = new Date().getFullYear();
    const plainPassword = `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;
    
    // Hashear la contraseña
    const saltRounds = 10;
    u.password_user = await bcrypt.hash(plainPassword, saltRounds);

    u.rol_usuario   = RolUsuario.ALUMNO;
    u.profile_image = 'no-image.png';

    return u;
  }
}
