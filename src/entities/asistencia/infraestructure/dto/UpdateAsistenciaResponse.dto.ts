import { ApiProperty } from '@nestjs/swagger';
import { EstadoAsistencia } from '../../enums/estado-asistencia.enum';

export class AsistenciaActualizadaDto {
  @ApiProperty({
    description: 'ID único del registro de asistencia',
    example: 'uuid-asistencia'
  })
  id_asistencia: string;

  @ApiProperty({
    description: 'Hora de llegada actualizada',
    example: '08:15'
  })
  hora_de_llegada: string;

  @ApiProperty({
    description: 'Hora de salida actualizada (puede ser null)',
    example: '14:00',
    required: false
  })
  hora_salida?: string | null;

  @ApiProperty({
    description: 'Estado de asistencia actualizado',
    enum: EstadoAsistencia,
    example: EstadoAsistencia.PUNTUAL
  })
  estado_asistencia: EstadoAsistencia;

  @ApiProperty({
    description: 'Fecha del registro de asistencia',
    example: '2024-01-15T00:00:00.000Z'
  })
  fecha: Date;
}

export class AlumnoInfoDto {
  @ApiProperty({
    description: 'ID único del alumno',
    example: 'uuid-alumno'
  })
  id_alumno: string;

  @ApiProperty({
    description: 'Código del alumno',
    example: 'A001'
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre del alumno',
    example: 'Juan'
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del alumno',
    example: 'Pérez'
  })
  apellido: string;
}

export class UpdateAsistenciaResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Asistencia actualizada exitosamente'
  })
  mensaje: string;

  @ApiProperty({
    description: 'Datos de la asistencia actualizada',
    type: AsistenciaActualizadaDto
  })
  asistencia_actualizada: AsistenciaActualizadaDto;

  @ApiProperty({
    description: 'Información del alumno',
    type: AlumnoInfoDto
  })
  alumno: AlumnoInfoDto;
}
