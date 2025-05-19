// src/auth/dto/alumno/alumno.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AlumnoDtoExcel {
  @ApiProperty({
    description: 'Código único del alumno',
    example: 'A2023001',
  })
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @ApiProperty({
    description: 'DNI del alumno',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  dni_alumno: string;

  @ApiProperty({
    description: 'Nombre(s) del alumno',
    example: 'Juan Carlos',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description: 'Apellido(s) del alumno',
    example: 'Pérez García',
  })
  @IsString()
  @IsNotEmpty()
  apellido: string;

  @ApiProperty({
    description: 'Fecha de nacimiento del alumno (YYYY-MM-DD)',
    example: '2010-05-15',
  })
  @IsDateString()
  @IsNotEmpty()
  fecha_nacimiento: string;

  @ApiProperty({
    description: 'Dirección del alumno',
    example: 'Av. Principal 123',
    required: false,
  })
  @IsString()
  @IsOptional()
  direccion?: string;

  @ApiProperty({
    description: 'Código QR para identificación del alumno',
    example: 'qr-12345678',
    required: false,
  })
  @IsString()
  @IsOptional()
  codigo_qr?: string;

  @ApiProperty({
    description: 'Nivel educativo del alumno',
    example: 'Secundaria',
  })
  @IsString()
  @IsNotEmpty()
  nivel: string;

  @ApiProperty({
    description: 'Grado que cursa el alumno (1-5)',
    example: 1,
    type: Number,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  grado: number;

  @ApiProperty({
    description: 'Sección a la que pertenece el alumno (un carácter)',
    example: 'A',
  })
  @IsString()
  @IsNotEmpty()
  seccion: string;

  @ApiProperty({
    description: 'ID del turno al que asiste el alumno',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  turno_id: string;

  @ApiProperty({
    description: 'ID del usuario asociado al alumno',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  usuario_id?: string;
}

// DTO para importación masiva desde Excel
export class ImportarExcelDto {
  @ApiProperty({
    description: 'ID del turno a asignar a todos los alumnos importados',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  turno_id: string;

  @ApiProperty({
    description: 'Archivo Excel con los datos de los alumnos',
    type: 'string',
    format: 'binary',
  })
  file: any;
}