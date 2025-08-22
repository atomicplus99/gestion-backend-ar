import { ApiProperty } from '@nestjs/swagger';

export class AnularAsistenciaResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación de la anulación',
    example: 'Asistencia anulada exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'Código del estudiante',
    example: '8320082025'
  })
  codigo_estudiante: string;

  @ApiProperty({
    description: 'Fecha de la anulación',
    example: '2025-08-22'
  })
  fecha: string;

  @ApiProperty({
    description: 'Motivo de la anulación registrado',
    example: 'Error en el registro de asistencia, el estudiante no estaba presente'
  })
  motivo: string;

  @ApiProperty({
    description: 'Hora exacta de la anulación',
    example: '2025-08-22T20:30:15.123Z'
  })
  timestamp: string;
}
