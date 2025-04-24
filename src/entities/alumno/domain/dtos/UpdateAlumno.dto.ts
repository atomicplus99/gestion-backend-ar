import {
    IsString,
    IsDateString,
    IsInt,
    Length,
    MaxLength,
    Min,
    Max,
    IsIn
} from 'class-validator';

export class UpdateAlumnoDto {


    @IsString()
    @Length(10, 10)
    codigo: string;

    @IsString()
    @Length(8, 8)
    dni_alumno: string;

    @IsString()
    @MaxLength(100)
    nombre: string;

    @IsString()
    @MaxLength(100)
    apellido: string;

    @IsDateString()
    fecha_nacimiento: Date;

    @IsString()
    @MaxLength(100)
    direccion: string;

    @IsIn(['Inicial', 'Primaria', 'Secundaria'])
    nivel: string;

    @IsInt()
    @Min(1)
    @Max(6)
    grado: number;

    @IsString()
    @Length(1, 1)
    seccion: string;
}
