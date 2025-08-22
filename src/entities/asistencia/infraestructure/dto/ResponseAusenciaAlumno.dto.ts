import { ApiProperty } from '@nestjs/swagger';

export class ResponseAusenciaAlumno {
  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Ausencia registrada exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'ID del registro de ausencia',
    example: '12345'
  })
  id: string;

  @ApiProperty({
    description: 'Nombre del estudiante',
    example: 'Juan Pérez'
  })
  alumno: string;

  @ApiProperty({
    description: 'Código del estudiante',
    example: 'EST001'
  })
  codigo: string;

  @ApiProperty({
    description: 'Fecha registrada',
    example: '2024-01-15'
  })
  fecha: string;

  @ApiProperty({
    description: 'Estado del registro',
    example: 'AUSENTE'
  })
  estado: string;
}
