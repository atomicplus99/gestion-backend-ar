import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { EstadoJustificacion } from '../justificacion.entity';

export class UpdateEstadoJustificacionDto {
  @ApiProperty({
    description: 'Nuevo estado de la justificación',
    enum: ['APROBADA', 'RECHAZADA'],
    example: 'APROBADA'
  })
  @IsNotEmpty({ message: 'El nuevo estado es obligatorio' })
  @IsEnum(EstadoJustificacion, { 
    message: 'El estado debe ser APROBADA o RECHAZADA' 
  })
  nuevo_estado: EstadoJustificacion.APROBADA | EstadoJustificacion.RECHAZADA;

  @ApiPropertyOptional({
    description: 'Observaciones de la respuesta (opcional)',
    example: 'Justificación médica válida, documentos correctos',
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  @MaxLength(500, { message: 'Las observaciones no pueden exceder 500 caracteres' })
  observaciones_respuesta?: string;
}
