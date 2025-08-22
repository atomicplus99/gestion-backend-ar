import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CrearAusenciaAlumnoDto {
  @ApiProperty({
    description: 'Código del estudiante',
    example: 'EST001',
    required: true
  })
  @IsNotEmpty({ message: 'El código del estudiante es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  codigo: string;

  @ApiProperty({
    description: 'Fecha específica para la ausencia (opcional, si no se envía usa fecha actual)',
    example: '2024-01-15',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'El formato de fecha debe ser YYYY-MM-DD' })
  fecha?: string;
}
