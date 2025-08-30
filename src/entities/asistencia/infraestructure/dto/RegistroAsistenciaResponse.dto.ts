import { ApiProperty } from '@nestjs/swagger';

export class AlumnoInfoResponse {
  @ApiProperty({ example: 'Juan', description: 'Nombre del estudiante' })
  nombre: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del estudiante' })
  apellido: string;

  @ApiProperty({ example: 'A001', description: 'Código del estudiante' })
  codigo: string;
}

export class AsistenciaInfoResponse {
  @ApiProperty({ example: 'uuid-asistencia', description: 'UUID del registro creado' })
  id_asistencia: string;

  @ApiProperty({ example: '08:15', description: 'Hora confirmada', nullable: true })
  hora_de_llegada: string | null;

  @ApiProperty({ example: '14:00', description: 'Hora de salida si se proporcionó', required: false })
  hora_salida?: string;

  @ApiProperty({ example: 'TARDANZA', description: 'Estado confirmado' })
  estado_asistencia: string;

  @ApiProperty({ example: '2025-08-22T00:00:00.000Z', description: 'Fecha del registro' })
  fecha: Date;

  @ApiProperty({ description: 'Información del alumno' })
  alumno: AlumnoInfoResponse;
}

export class RegistroAsistenciaResponseManual {
  @ApiProperty({ example: 'Asistencia manual registrada correctamente ✅', description: 'Mensaje de confirmación' })
  message: string;

  @ApiProperty({ description: 'Información de la asistencia creada' })
  asistencia: AsistenciaInfoResponse;
}
