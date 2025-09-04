import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsDateString, ValidateIf } from 'class-validator';

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
    description: 'ID del auxiliar que realiza la anulación (opcional si se envía id_usuario)',
    example: '939cada0-3a91-4771-aebd-44d008fbeec6',
    required: false
  })
  @ValidateIf((o) => !o.id_usuario)
  @IsNotEmpty({ message: 'Debe proporcionar id_auxiliar o id_usuario' })
  @IsString({ message: 'El ID del auxiliar debe ser una cadena de texto' })
  id_auxiliar?: string;

  @ApiProperty({
    description: 'ID del usuario (administrador o director) que realiza la anulación (opcional si se envía id_auxiliar)',
    example: '08cf401f-c19d-4906-840a-fb774e078eab',
    required: false
  })
  @ValidateIf((o) => !o.id_auxiliar)
  @IsNotEmpty({ message: 'Debe proporcionar id_auxiliar o id_usuario' })
  @IsString({ message: 'El ID del usuario debe ser una cadena de texto' })
  id_usuario?: string;

  @ApiProperty({
    description: 'Fecha de la asistencia a anular (YYYY-MM-DD). Si no se envía, se usa la fecha actual de Perú.',
    example: '2025-09-02',
    required: false
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  fecha?: string;
}
