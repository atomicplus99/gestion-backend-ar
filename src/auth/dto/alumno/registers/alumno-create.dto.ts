// src/auth/dto/alumno/registers/alumno-create.dto.ts

import {
  IsString, IsNotEmpty, Length, Matches, MaxLength,
  IsDateString, IsIn, IsInt, Min, Max, IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterAlumnoDto {
  @ApiProperty({ 
    description: 'Código único del estudiante (14 dígitos)', 
    example: '12345678901234',
    minLength: 14,
    maxLength: 14
  })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código es obligatorio' })
  @Length(14, 14, { message: 'El código debe tener exactamente 14 dígitos' })
  @Matches(/^\d{14}$/, { message: 'El código debe contener solo números' })
  codigo: string;

  @ApiProperty({ 
    description: 'DNI del alumno (8 dígitos)', 
    example: '12345678',
    minLength: 8,
    maxLength: 8
  })
  @IsString({ message: 'El DNI debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El DNI es obligatorio' })
  @Length(8, 8, { message: 'El DNI debe tener exactamente 8 dígitos' })
  @Matches(/^\d{8}$/, { message: 'El DNI debe contener solo números' })
  dni_alumno: string;

  @ApiProperty({ 
    description: 'Nombre del alumno',
    example: 'Juan Carlos',
    maxLength: 100
  })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  nombre: string;

  @ApiProperty({ 
    description: 'Apellido del alumno',
    example: 'García López',
    maxLength: 100
  })
  @IsString({ message: 'El apellido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El apellido es obligatorio' })
  @MaxLength(100, { message: 'El apellido no puede exceder 100 caracteres' })
  apellido: string;

  @ApiProperty({ 
    format: 'date',
    description: 'Fecha de nacimiento del alumno',
    example: '2005-06-15'
  })
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser una fecha válida' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  fecha_nacimiento: string;

  @ApiPropertyOptional({ 
    description: 'Dirección del alumno',
    example: 'Av. Principal 123, Distrito',
    maxLength: 100
  })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La dirección no puede exceder 100 caracteres' })
  direccion?: string;

  @ApiProperty({ 
    description: 'Código QR único del alumno',
    example: 'QR_ALUMNO_123456789'
  })
  @IsString({ message: 'El código QR debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El código QR es obligatorio' })
  codigo_qr: string;

  @ApiProperty({ 
    enum: ['Inicial', 'Primaria', 'Secundaria'],
    description: 'Nivel educativo del alumno',
    example: 'Secundaria'
  })
  @IsIn(['Inicial', 'Primaria', 'Secundaria'], { 
    message: 'El nivel debe ser: Inicial, Primaria o Secundaria' 
  })
  @IsNotEmpty({ message: 'El nivel es obligatorio' })
  nivel: string;

  @ApiProperty({ 
    minimum: 1, 
    maximum: 6,
    description: 'Grado del alumno',
    example: 3
  })
  @IsInt({ message: 'El grado debe ser un número entero' })
  @Min(1, { message: 'El grado debe ser mayor o igual a 1' })
  @Max(6, { message: 'El grado debe ser menor o igual a 6' })
  @IsNotEmpty({ message: 'El grado es obligatorio' })
  grado: number;

  @ApiProperty({ 
    description: 'Sección del alumno (una letra)',
    example: 'A',
    minLength: 1,
    maxLength: 1
  })
  @IsString({ message: 'La sección debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La sección es obligatoria' })
  @Length(1, 1, { message: 'La sección debe ser exactamente 1 caracter' })
  @Matches(/^[A-Z]$/, { message: 'La sección debe ser una letra mayúscula (A-Z)' })
  seccion: string;

  @ApiProperty({ 
    format: 'uuid',
    description: 'ID del turno asignado al alumno',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID('4', { message: 'El ID del turno debe ser un UUID válido' })
  @IsNotEmpty({ message: 'El ID del turno es obligatorio' })
  turno_id: string;
}
