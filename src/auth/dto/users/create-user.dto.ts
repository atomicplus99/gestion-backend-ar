import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, Matches, IsEnum } from 'class-validator';
import { RolUsuario } from 'src/common/enums/rol-usuario.enum';


export class CreateUsuarioDto {
  @ApiProperty({ description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  nombre_usuario: string;

  @ApiProperty({ description: 'Contraseña en texto plano' })
  @IsString()
  @IsNotEmpty()
  password_user: string;

  @ApiProperty({ enum: RolUsuario })
  @IsEnum(RolUsuario)
  rol_usuario: RolUsuario;

  @ApiProperty({ description: 'Ruta a la imagen de perfil' })
  @IsString()
  @IsNotEmpty()
  profile_image: string;
}
