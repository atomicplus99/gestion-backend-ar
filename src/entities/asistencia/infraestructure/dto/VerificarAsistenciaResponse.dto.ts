import { ApiProperty } from '@nestjs/swagger';

export class AlumnoInfoAsistenciaManual {
  @ApiProperty({ example: 'uuid-alumno', description: 'ID único del alumno' })
  id_alumno: string;

  @ApiProperty({ example: 'A001', description: 'Código del alumno' })
  codigo: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del alumno' })
  nombre: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del alumno' })
  apellido: string;

  @ApiProperty({ example: '1A', description: 'Sección del alumno' })
  seccion: string;

  @ApiProperty({ example: 1, description: 'Grado del alumno' })
  grado: number;

  @ApiProperty({ example: 'Primaria', description: 'Nivel educativo' })
  nivel: string;

  @ApiProperty({ example: 'Mañana', description: 'Turno del alumno', required: false })
  turno?: string;
}

export class AsistenciaExistenteManual {
  @ApiProperty({ example: 'uuid-asistencia', description: 'ID único de la asistencia' })
  id_asistencia: string;

  @ApiProperty({ example: '08:00:00', description: 'Hora de llegada' })
  hora_de_llegada: string;

  @ApiProperty({ example: '15:00:00', description: 'Hora de salida', required: false })
  hora_salida?: string;

  @ApiProperty({ example: 'PRESENTE', description: 'Estado de la asistencia' })
  estado_asistencia: string;

  @ApiProperty({ example: '2024-01-15T00:00:00.000Z', description: 'Fecha de la asistencia' })
  fecha: Date;
}

export class VerificarAsistenciaResponse {
  @ApiProperty({ example: true, description: 'Indica si el alumno tiene asistencia registrada para la fecha' })
  tiene_asistencia: boolean;

  @ApiProperty({ example: 'El alumno ya tiene asistencia registrada para hoy', description: 'Mensaje descriptivo del resultado' })
  mensaje: string;

  @ApiProperty({ description: 'Información del alumno si existe', required: false })
  alumno?: AlumnoInfoAsistenciaManual;

  @ApiProperty({ description: 'Información de la asistencia si ya existe', required: false })
  asistencia?: AsistenciaExistenteManual;
}
