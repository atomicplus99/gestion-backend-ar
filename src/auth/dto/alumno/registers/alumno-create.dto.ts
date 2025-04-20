// src/auth/dto/alumno/create-alumno.dto.ts

import {
    IsString, IsNotEmpty, Length, Matches, MaxLength,
    IsDateString, IsIn, IsInt, Min, Max, IsUUID,
  } from 'class-validator';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class RegisterAlumnoDto {
    @ApiProperty({ description: 'Código único (10 dígitos)' })
    @IsString()
    @Length(10,10)
    @Matches(/^\d{10}$/)
    codigo: string;
  
    @ApiProperty({ description: 'DNI (8 dígitos)' })
    @IsString()
    @Length(8,8)
    @Matches(/^\d{8}$/)
    dni_alumno: string;
  
    @ApiProperty() @IsString() @MaxLength(100)
    nombre: string;
  
    @ApiProperty() @IsString() @MaxLength(100)
    apellido: string;
  
    @ApiProperty({ format: 'date' }) @IsDateString()
    fecha_nacimiento: string;
  
    @ApiPropertyOptional() @IsString() @MaxLength(100)
    direccion?: string;
  
    @ApiProperty() @IsString()
    codigo_qr: string;
  
    @ApiProperty({ enum: ['Inicial','Primaria','Secundaria'] })
    @IsIn(['Inicial','Primaria','Secundaria'])
    nivel: string;
  
    @ApiProperty({ minimum:1, maximum:6 }) @IsInt() @Min(1) @Max(6)
    grado: number;
  
    @ApiProperty() @IsString() @Length(1,1) @Matches(/^[A-Z]$/)
    seccion: string;
  
    @ApiProperty({ format: 'uuid' }) @IsUUID()
    turno_id: string;
  }
  