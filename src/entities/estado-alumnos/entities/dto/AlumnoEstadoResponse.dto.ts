import { ApiProperty } from '@nestjs/swagger';

export class TurnoDto {
  @ApiProperty({ description: 'ID único del turno' })
  id_turno: string;

  @ApiProperty({ description: 'Nombre del turno (mañana, tarde, noche)' })
  turno: string;

  @ApiProperty({ description: 'Hora de inicio del turno' })
  hora_inicio: string;

  @ApiProperty({ description: 'Hora de fin del turno' })
  hora_fin: string;

  @ApiProperty({ description: 'Hora límite del turno' })
  hora_limite: string;
}

export class UsuarioDto {
  @ApiProperty({ description: 'ID único del usuario' })
  id_user: string;

  @ApiProperty({ description: 'Nombre de usuario del estudiante' })
  nombre_usuario: string;

  @ApiProperty({ description: 'Rol del usuario (ALUMNO)' })
  rol_usuario: string;
}

export class EstadoActualDto {
  @ApiProperty({ 
    description: 'Estado actual del alumno',
    enum: ['activo', 'inactivo'],
    example: 'activo'
  })
  estado: 'activo' | 'inactivo';

  @ApiProperty({ description: 'Observaciones sobre el estado actual' })
  observacion: string;

  @ApiProperty({ description: 'Fecha de última actualización del estado' })
  fecha_actualizacion: Date;
}

export class AlumnoEstadoResponseDto {
  @ApiProperty({ description: 'ID único del alumno' })
  id_alumno: string;

  @ApiProperty({ description: 'Código de 14 dígitos del estudiante' })
  codigo: string;

  @ApiProperty({ description: 'DNI de 8 dígitos del estudiante' })
  dni_alumno: string;

  @ApiProperty({ description: 'Nombre del estudiante' })
  nombre: string;

  @ApiProperty({ description: 'Apellido del estudiante' })
  apellido: string;

  @ApiProperty({ description: 'Fecha de nacimiento del estudiante' })
  fecha_nacimiento: Date;

  @ApiProperty({ description: 'Dirección completa del estudiante' })
  direccion: string;

  @ApiProperty({ description: 'Código QR del estudiante' })
  codigo_qr: string;

  @ApiProperty({ 
    description: 'Nivel educativo',
    enum: ['Inicial', 'Primaria', 'Secundaria']
  })
  nivel: string;

  @ApiProperty({ 
    description: 'Grado académico',
    minimum: 1,
    maximum: 12
  })
  grado: number;

  @ApiProperty({ description: 'Sección del grado (A, B, C, etc.)' })
  seccion: string;

  @ApiProperty({ 
    description: 'Información del turno académico',
    type: TurnoDto,
    nullable: true
  })
  turno: TurnoDto | null;

  @ApiProperty({ 
    description: 'Información del usuario del sistema',
    type: UsuarioDto,
    nullable: true
  })
  usuario: UsuarioDto | null;

  @ApiProperty({ 
    description: 'Estado actual del alumno',
    type: EstadoActualDto
  })
  estado_actual: EstadoActualDto;
}
  