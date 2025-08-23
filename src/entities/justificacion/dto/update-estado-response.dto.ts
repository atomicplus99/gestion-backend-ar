import { ApiProperty } from '@nestjs/swagger';
import { JustificacionListResponseDto } from './list-justificaciones-response.dto';

export class UpdateEstadoJustificacionResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 200
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje descriptivo',
    example: 'Estado de justificación actualizado exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'Justificación actualizada',
    type: JustificacionListResponseDto
  })
  data: JustificacionListResponseDto;
}
