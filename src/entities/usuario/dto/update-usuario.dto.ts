import { IsString, IsOptional, MinLength, IsBoolean } from 'class-validator';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'El nombre de usuario debe tener al menos 3 caracteres' })
  nombre_usuario?: string;

  @IsOptional()
  @IsString()
  profile_image?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
