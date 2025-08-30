import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { RolUsuario } from '../../../common/enums/rol-usuario.enum';

export class UsuariosCompletosFiltersDto {
  @ApiProperty({ 
    description: 'Filtrar por rol de usuario', 
    enum: RolUsuario, 
    required: false 
  })
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @ApiProperty({ 
    description: 'Filtrar por estado activo', 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  activo?: boolean;

  @ApiProperty({ 
    description: 'Buscar por nombre de usuario, nombres, apellidos o email', 
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    description: 'Número de página', 
    minimum: 1, 
    default: 1, 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Límite de resultados por página', 
    minimum: 1, 
    maximum: 100, 
    default: 10, 
    required: false 
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
