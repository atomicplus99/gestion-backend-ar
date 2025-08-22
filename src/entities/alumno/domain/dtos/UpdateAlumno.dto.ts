import {
    IsString,
    IsDateString,
    IsInt,
    Length,
    MaxLength,
    Min,
    Max,
    IsIn,
    IsOptional,
    IsUUID
} from 'class-validator';

export class UpdateAlumnoDto {

    @IsOptional()
    @IsString()
    @Length(14, 14)
    codigo?: string;

    @IsOptional()
    @IsString()
    @Length(8, 8)
    dni_alumno?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    nombre?: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    apellido?: string;

    @IsOptional()
    @IsDateString()
    fecha_nacimiento?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    direccion?: string;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    codigo_qr?: string;

    @IsOptional()
    @IsIn(['Inicial', 'Primaria', 'Secundaria'])
    nivel?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(12)
    grado?: number;

    @IsOptional()
    @IsString()
    @Length(1, 1)
    seccion?: string;

    @IsOptional()
    @IsUUID()
    id_turno?: string;
}
