import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsArray, IsOptional, MinLength, MaxLength, ArrayMinSize } from 'class-validator';
import { TipoJustificacion } from '../justificacion.entity';

export class CreateJustificacionDto {
  @ApiProperty({
    description: 'ID del alumno para quien se crea la justificación',
    example: '20109a71-510a-4f0e-8d32-51f257b22700',
    required: true
  })
  @IsNotEmpty({ message: 'El ID del alumno es obligatorio' })
  @IsString({ message: 'El ID del alumno debe ser una cadena de texto' })
  id_alumno: string;

  @ApiProperty({
    description: 'ID del auxiliar que crea la justificación',
    example: '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b',
    required: true
  })
  @IsNotEmpty({ message: 'El ID del auxiliar es obligatorio' })
  @IsString({ message: 'El ID del auxiliar debe ser una cadena de texto' })
  id_auxiliar: string;

  @ApiProperty({
    description: 'Array de fechas a justificar en formato DD-MM-YYYY. Permite fechas pasadas y futuras para justificaciones anticipadas.',
    example: ['22-08-2025', '23-08-2025', '24-08-2025'],
    type: [String],
    required: true
  })
  @IsArray({ message: 'Las fechas de justificación deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe proporcionar al menos una fecha de justificación' })
  @IsString({ each: true, message: 'Cada fecha debe ser una cadena de texto' })
  fecha_de_justificacion: string[];

  @ApiProperty({
    description: 'Tipo de justificación',
    enum: TipoJustificacion,
    example: TipoJustificacion.MEDICA,
    required: true
  })
  @IsNotEmpty({ message: 'El tipo de justificación es obligatorio' })
  @IsEnum(TipoJustificacion, { message: 'El tipo de justificación debe ser válido' })
  tipo_justificacion: TipoJustificacion;

  @ApiProperty({
    description: 'Motivo de la justificación',
    example: 'Consulta médica por enfermedad respiratoria',
    minLength: 10,
    maxLength: 1000,
    required: true
  })
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'El motivo no puede exceder 1000 caracteres' })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Array de documentos adjuntos (nombres de archivos)',
    example: ['receta_medica.pdf', 'certificado_medico.pdf'],
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray({ message: 'Los documentos adjuntos deben ser un array' })
  @IsString({ each: true, message: 'Cada documento debe ser una cadena de texto' })
  documentos_adjuntos?: string[];
}
