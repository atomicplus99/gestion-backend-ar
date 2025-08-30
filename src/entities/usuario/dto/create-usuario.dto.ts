import { IsString, IsEnum, MinLength } from 'class-validator';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';

export class CreateUsuarioDto {
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  nombre_usuario: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsEnum(RolUsuario, { message: 'El rol debe ser uno de: AUXILIAR, ALUMNO, DIRECTOR, ADMINISTRADOR' })
  rol: RolUsuario;
}
