import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min, Max } from 'class-validator';
import { TipoJustificacion, EstadoJustificacion } from '../justificacion.entity';

export class FiltroJustificacionesDto {
  @ApiPropertyOptional({
    description: 'Código del alumno para filtrar',
    example: '2311682025',
    required: false
  })
  @IsOptional()
  @IsString()
  codigo_alumno?: string;

  @ApiPropertyOptional({
    description: 'Estado de la justificación para filtrar',
    enum: EstadoJustificacion,
    example: EstadoJustificacion.PENDIENTE,
    required: false
  })
  @IsOptional()
  @IsEnum(EstadoJustificacion)
  estado?: EstadoJustificacion;

  @ApiPropertyOptional({
    description: 'Tipo de justificación para filtrar',
    enum: TipoJustificacion,
    example: TipoJustificacion.MEDICA,
    required: false
  })
  @IsOptional()
  @IsEnum(TipoJustificacion)
  tipo_justificacion?: TipoJustificacion;

  @ApiPropertyOptional({
    description: 'Fecha de inicio para filtrar (formato: YYYY-MM-DD)',
    example: '2025-08-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  fecha_desde?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin para filtrar (formato: YYYY-MM-DD)',
    example: '2025-08-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  fecha_hasta?: string;
}



export class ListJustificacionesQueryDto extends FiltroJustificacionesDto {
  @ApiPropertyOptional({
    description: 'Número de página (comienza en 1)',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({
    description: 'Número de elementos por página',
    example: 10,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  elementos_por_pagina?: number = 10;
}
