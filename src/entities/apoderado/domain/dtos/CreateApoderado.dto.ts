import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsArray, IsUUID } from 'class-validator';
import { TipoRelacion } from '../enums/tipo-relacion.enum';

export class CreateApoderadoDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  dni?: string;

  @IsEnum(TipoRelacion)
  tipo_relacion: TipoRelacion;

  @IsOptional()
  @IsString()
  relacion_especifica?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  pupilos?: string[];
}
