import {
    IsString,
    IsNotEmpty,
    IsDateString,
    IsInt,
    Length,
    IsOptional,
    ValidateIf,
    Matches
  } from 'class-validator';
  
  export class CreateAlumnoDto {
    @IsString()
    @Length(8, 8)
    dni_alumno: string;
  
    @IsString()
    @IsNotEmpty()
    nombre: string;
  
    @IsString()
    @IsNotEmpty()
    apellido: string;
  
    @IsDateString()
    fecha_nacimiento: Date;
  
    @IsString()
    @IsNotEmpty()
    direccion: string;
  
    @IsString()
    @IsNotEmpty()
    codigo_qr: string;
  
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{10}$/, { message: 'El código debe tener exactamente 10 dígitos numéricos.' })
    codigo: string;
  
    @IsString()
    turno_id: string;
  
    @ValidateIf(o => o.usuario_id !== null && o.usuario_id !== undefined)
    @IsString()
    usuario_id?: string;
  
    @IsString()
    nivel: string;
  
    @IsInt()
    grado: number;
  
    @IsString()
    seccion: string;
  }
  