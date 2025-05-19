// src/entities/asistencia/domain/dtos/create-asistencia-manual.dto.ts

import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { EstadoAsistencia } from '../../enums/estado-asistencia.enum';

export class CreateAsistenciaManualDto {
  @IsNotEmpty()
  @IsString()
  id_alumno: string;

  @IsNotEmpty()
  @IsString()
  hora_de_llegada: string;

  @IsOptional()
  @IsString()
  hora_salida?: string;

  @IsNotEmpty()
  @IsEnum(EstadoAsistencia)
  estado_asistencia: EstadoAsistencia;

  @IsNotEmpty()
  @IsString()
  motivo: string;

  @IsNotEmpty()
  @IsString()
  id_auxiliar: string;
}
