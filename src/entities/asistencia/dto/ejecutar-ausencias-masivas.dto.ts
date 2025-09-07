import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';

export enum TurnosAusenciasMasivas {
  MAÑANA = 'MAÑANA',
  TARDE = 'TARDE',
  AMBOS = 'AMBOS'
}

export class EjecutarAusenciasMasivasDto {
  @ApiProperty({
    description: 'Fecha para ejecutar el programa (YYYY-MM-DD). Si no se especifica, usa la fecha actual',
    required: false,
    example: '2025-08-22'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD'
  })
  fecha?: string;

  @ApiProperty({
    description: 'Hora para ejecutar el programa (HH:MM:SS). Si no se especifica, usa la hora actual',
    required: false,
    example: '14:30:00'
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'La hora debe tener el formato HH:MM:SS'
  })
  hora?: string;

  @ApiProperty({
    description: 'Turnos a procesar: MAÑANA, TARDE, AMBOS. Si no se especifica, procesa ambos turnos',
    required: false,
    enum: TurnosAusenciasMasivas,
    example: TurnosAusenciasMasivas.TARDE
  })
  @IsOptional()
  @IsEnum(TurnosAusenciasMasivas, {
    message: `turnos debe ser uno de los siguientes valores: ${Object.keys(TurnosAusenciasMasivas).join(', ')}`
  })
  turnos?: TurnosAusenciasMasivas;

  // Constructor para logging
  constructor() {
  }

  // Método para logging cuando se valida
  afterLoad() {
  }
}
