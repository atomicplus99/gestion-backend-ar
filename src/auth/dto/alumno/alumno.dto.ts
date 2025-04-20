// src/auth/dto/users/create-alumno.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    Length,
    Matches,
    MaxLength,
    IsDateString,
    IsIn,
    IsInt,
    Min,
    Max,
    IsUUID,
    IsOptional,
  } from 'class-validator';
import { UniqueCodigo } from 'src/common/validations/unique-code-alumno.validator';
  
  export class AlumnoDto {

    @ApiProperty({ description: 'Código único de 10 dígitos numéricos' })
    @UniqueCodigo()
    @IsString()
    @IsNotEmpty()
    @Length(10, 10)
    @Matches(/^\d{10}$/, { message: 'El código debe ser 10 dígitos numéricos' })
    codigo: string;
  
    @ApiProperty({ description: 'DNI de 8 dígitos de forma obligatoria' })
    @IsString()
    @IsNotEmpty()
    @Length(8, 8)
    @Matches(/^\d{8}$/, { message: 'El DNI debe tener 8 dígitos' })
    dni_alumno: string;
  
    @ApiProperty({ description: 'Solo contenera 100 caracteres como maximo', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nombre: string;
  
    @ApiProperty({ description: 'Solo contenera 100 caracteres como maximo', maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    apellido: string;
  
    @ApiProperty({ type: String, format: 'date', description: 'Formato YYYY‑MM‑DD' })
    @IsDateString()
    @IsNotEmpty()
    fecha_nacimiento: string;
  
    @ApiPropertyOptional({ description: 'Solo contenera 100 caracteres como maximo'  ,maxLength: 100 })
    @IsString()
    @MaxLength(100)
    @IsOptional()
    direccion?: string;
  
    @ApiProperty({ description: 'UUID generado para el QR desde el lado del frontend' })
    @IsString()
    @IsNotEmpty()
    codigo_qr: string;
  
    @ApiProperty( {description: 'Solo desde nivel inicial,primaria y secundaria', 
                    enum: ['Inicial', 'Primaria', 'Secundaria'] })
    @IsString()
    @IsNotEmpty()
    @IsIn(['Inicial', 'Primaria', 'Secundaria'])
    nivel: string;
  
    @ApiProperty({ minimum: 1, maximum: 6 })
    @IsInt()
    @Min(1)
    @Max(6, { message: 'Grado fuera de rango para el nivel' })
    grado: number;
  
    @ApiProperty({ description: 'Sección (una letra A–Z)' })
    @IsString()
    @Length(1, 1)
    @Matches(/^[A-Z]$/)
    seccion: string;
  
    @ApiPropertyOptional({ type: 'string', format: 'uuid', description: 'Turno asignado o generado automatico' })
    @IsUUID()
    turno_id: string;
  
  }
  