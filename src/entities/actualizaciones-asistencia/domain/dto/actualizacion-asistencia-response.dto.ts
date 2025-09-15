import { ApiProperty } from '@nestjs/swagger';
import { getAccionAmigable } from '../../constants/acciones-asistencia.constants';

export class ActualizacionAsistenciaResponseDto {
  @ApiProperty({
    description: 'ID único de la actualización',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'ID de la asistencia relacionada',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  id_asistencia: string;

  @ApiProperty({
    description: 'ID del alumno',
    example: '123e4567-e89b-12d3-a456-426614174002'
  })
  id_alumno: string;

  @ApiProperty({
    description: 'Información del alumno',
    type: 'object',
    properties: {
      id_alumno: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174002' },
      nombre: { type: 'string', example: 'Juan' },
      apellido: { type: 'string', example: 'Pérez' },
      codigo: { type: 'string', example: '12345678' }
    }
  })
  alumno: {
    id_alumno: string;
    nombre: string;
    apellido: string;
    codigo: string;
  };

  @ApiProperty({
    description: 'Información del auxiliar (si aplica)',
    type: 'object',
    properties: {
      id_auxiliar: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174003' },
      nombre: { type: 'string', example: 'María' },
      apellido: { type: 'string', example: 'González' }
    }
  })
  auxiliar?: {
    id_auxiliar: string;
    nombre: string;
    apellido: string;
  };

  @ApiProperty({
    description: 'Información del administrador (si aplica)',
    type: 'object',
    properties: {
      id_administrador: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174004' },
      nombre: { type: 'string', example: 'Carlos' },
      apellido: { type: 'string', example: 'López' }
    }
  })
  administrador?: {
    id_administrador: string;
    nombre: string;
    apellido: string;
  };

  @ApiProperty({
    description: 'Información del director (si aplica)',
    type: 'object',
    properties: {
      id_director: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174005' },
      nombre: { type: 'string', example: 'Ana' },
      apellido: { type: 'string', example: 'Martínez' }
    }
  })
  director?: {
    id_director: string;
    nombre: string;
    apellido: string;
  };

  @ApiProperty({
    description: 'Motivo de la actualización',
    example: 'Registro manual por ausencia justificada'
  })
  motivo: string;

  @ApiProperty({
    description: 'Código técnico de la acción realizada',
    example: 'CREAR_ASISTENCIA_MANUAL'
  })
  accion_realizada: string;

  @ApiProperty({
    description: 'Texto amigable de la acción realizada para el usuario',
    example: 'Registro Manual de Asistencia'
  })
  accion_amigable: string;

  @ApiProperty({
    description: 'Fecha y hora de la actualización',
    example: '2025-09-14T10:30:00.000Z'
  })
  fecha_actualizacion: Date;

  constructor(actualizacion: any) {
    this.id = actualizacion.id;
    this.id_asistencia = actualizacion.asistencia?.id_asistencia;
    this.id_alumno = actualizacion.alumno?.id_alumno;
    this.alumno = {
      id_alumno: actualizacion.alumno?.id_alumno,
      nombre: actualizacion.alumno?.nombre,
      apellido: actualizacion.alumno?.apellido,
      codigo: actualizacion.alumno?.codigo,
    };
    
    if (actualizacion.auxiliar) {
      this.auxiliar = {
        id_auxiliar: actualizacion.auxiliar.id_auxiliar,
        nombre: actualizacion.auxiliar.nombre,
        apellido: actualizacion.auxiliar.apellido,
      };
    }
    
    if (actualizacion.administrador) {
      this.administrador = {
        id_administrador: actualizacion.administrador.id_administrador,
        nombre: actualizacion.administrador.nombres,
        apellido: actualizacion.administrador.apellidos,
      };
    }
    
    if (actualizacion.director) {
      this.director = {
        id_director: actualizacion.director.id_director,
        nombre: actualizacion.director.nombres,
        apellido: actualizacion.director.apellidos,
      };
    }
    
    this.motivo = actualizacion.motivo;
    this.accion_realizada = actualizacion.accion_realizada;
    this.accion_amigable = getAccionAmigable(actualizacion.accion_realizada);
    this.fecha_actualizacion = actualizacion.fechaActualizacion;
  }
}
