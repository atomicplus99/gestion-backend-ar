// src/entities/asistencia/domain/dtos/update-asistencia.dto.ts

import { IsOptional, IsString, IsEnum } from 'class-validator';
import { EstadoAsistencia } from '../../enums/estado-asistencia.enum';

export class UpdateAsistenciaDto {
  
  @IsOptional()
  @IsString()
  codigo_alumno?: string;

  @IsOptional()
  @IsString()
  dni_alumno?: string;

  @IsOptional()
  @IsString()
  hora_de_llegada?: string;

  @IsOptional()
  @IsString()
  hora_salida?: string;

  @IsOptional()
  @IsEnum(EstadoAsistencia)
  estado_asistencia?: EstadoAsistencia;

  @IsString()
  motivo_actualizacion: string;

  @IsString()
  id_auxiliar: string;
}
