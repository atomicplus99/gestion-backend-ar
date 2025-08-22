import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class AnularAsistenciaRequestDto {
  @ApiProperty({
    description: 'Código del estudiante a anular asistencia',
    example: '8320082025',
    required: true
  })
  @IsNotEmpty({ message: 'El código del estudiante es obligatorio' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  codigo_estudiante: string;

  @ApiProperty({
    description: 'Motivo de la anulación (mínimo 10, máximo 500 caracteres)',
    example: 'Error en el registro de asistencia, el estudiante no estaba presente',
    required: true
  })
  @IsNotEmpty({ message: 'El motivo de la anulación es obligatorio' })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
  motivo: string;

  @ApiProperty({
    description: 'ID del auxiliar que realiza la anulación',
    example: '939cada0-3a91-4771-aebd-44d008fbeec6',
    required: true
  })
  @IsNotEmpty({ message: 'El ID del auxiliar es obligatorio' })
  @IsString({ message: 'El ID del auxiliar debe ser una cadena de texto' })
  id_auxiliar: string;
}
