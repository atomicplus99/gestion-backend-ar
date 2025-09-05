import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsArray, IsOptional, MinLength, MaxLength, ArrayMinSize, ValidateIf } from 'class-validator';
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

  @ApiPropertyOptional({
    description: 'ID del auxiliar que crea la justificación (opcional si se envía id_administrador, id_director o id_usuario)',
    example: '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b'
  })
  @ValidateIf(o => !o.id_administrador && !o.id_director && !o.id_usuario)
  @IsNotEmpty({ message: 'Debe proporcionar al menos un ID de auxiliar, administrador, director o usuario' })
  @IsString({ message: 'El ID del auxiliar debe ser una cadena de texto' })
  id_auxiliar?: string;

  @ApiPropertyOptional({
    description: 'ID del administrador que crea la justificación (opcional si se envía id_auxiliar, id_director o id_usuario)',
    example: '08cf401f-c19d-4906-840a-fb774e078eab'
  })
  @ValidateIf(o => !o.id_auxiliar && !o.id_director && !o.id_usuario)
  @IsNotEmpty({ message: 'Debe proporcionar al menos un ID de auxiliar, administrador, director o usuario' })
  @IsString({ message: 'El ID del administrador debe ser una cadena de texto' })
  id_administrador?: string;

  @ApiPropertyOptional({
    description: 'ID del director que crea la justificación (opcional si se envía id_auxiliar, id_administrador o id_usuario)',
    example: 'f5ad31cd-b75a-4163-a38e-74ed1a01fa32'
  })
  @ValidateIf(o => !o.id_auxiliar && !o.id_administrador && !o.id_usuario)
  @IsNotEmpty({ message: 'Debe proporcionar al menos un ID de auxiliar, administrador, director o usuario' })
  @IsString({ message: 'El ID del director debe ser una cadena de texto' })
  id_director?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario (auxiliar, administrador o director) que crea la justificación (opcional si se envía id_auxiliar, id_administrador o id_director)',
    example: '08cf401f-c19d-4906-840a-fb774e078eab'
  })
  @ValidateIf(o => !o.id_auxiliar && !o.id_administrador && !o.id_director)
  @IsNotEmpty({ message: 'Debe proporcionar al menos un ID de auxiliar, administrador, director o usuario' })
  @IsString({ message: 'El ID del usuario debe ser una cadena de texto' })
  id_usuario?: string;

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
    description: 'Motivo detallado de la justificación',
    example: 'Consulta médica por enfermedad respiratoria',
    required: true
  })
  @IsNotEmpty({ message: 'El motivo de la justificación es obligatorio' })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede exceder los 500 caracteres' })
  motivo: string;

  @ApiPropertyOptional({
    description: 'Array de nombres de documentos adjuntos (opcional)',
    example: ['receta_medica.pdf', 'certificado_medico.pdf'],
    type: [String],
    default: []
  })
  @IsOptional()
  @IsArray({ message: 'Los documentos adjuntos deben ser un array' })
  @IsString({ each: true, message: 'Cada documento debe ser una cadena de texto' })
  documentos_adjuntos?: string[];
}
