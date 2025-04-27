import { IsString, IsIn, MaxLength, IsOptional } from 'class-validator';

export class UpdateEstadoAlumno {
  @IsIn(['activo', 'inactivo'])
  estado: 'activo' | 'inactivo';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacion: string;
} 
