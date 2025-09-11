import { Injectable } from '@nestjs/common';
import { Usuario } from '../../../usuario/usuario.entity';
import { Alumno } from '../../domain/entities/Alumno';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioMapper {
  async mapToUsuario(alumno: Alumno): Promise<Usuario> {
    const usuario = new Usuario();
    
    // Generar nombre de usuario único
    const nombreUsuario = this.generateNombreUsuario(alumno.nombre, alumno.apellido);
    usuario.nombre_usuario = nombreUsuario;
    
    // Generar contraseña predeterminada
    const password = this.generatePassword(alumno.nombre, alumno.apellido);
    usuario.password_user = await this.hashPassword(password);
    
    // Establecer rol y configuración predeterminada
    usuario.rol_usuario = RolUsuario.ALUMNO;
    usuario.profile_image = 'no-image.png';
    
    return usuario;
  }

  private generateNombreUsuario(nombre: string, apellido: string): string {
    const firstName = (nombre || 'Sin').trim().split(' ')[0];
    const firstLast = (apellido || 'Nombre').trim().split(' ')[0];
    return `${firstName.toUpperCase()}.${firstLast.toUpperCase()}`;
  }

  private generatePassword(nombre: string, apellido: string): string {
    const firstName = (nombre || 'Sin').trim().split(' ')[0];
    const firstLast = (apellido || 'Nombre').trim().split(' ')[0];
    const year = new Date().getFullYear();
    return `${firstName.toLowerCase()}${firstLast.toLowerCase()}${year}`;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async makeNombreUsuarioUnico(nombreUsuario: string): Promise<string> {
    // Agregar sufijo aleatorio si es necesario
    return `${nombreUsuario}${Math.floor(Math.random() * 1000)}`;
  }
}

