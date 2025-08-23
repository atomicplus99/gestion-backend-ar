import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoJustificacion, EstadoJustificacion } from '../justificacion.entity';

export class AlumnoSolicitanteDto {
  @ApiProperty({
    description: 'ID único del alumno',
    example: '20109a71-510a-4f0e-8d32-51f257b22700'
  })
  id_alumno: string;

  @ApiProperty({
    description: 'Código del alumno',
    example: '2311682025'
  })
  codigo: string;

  @ApiProperty({
    description: 'Nombre del alumno',
    example: 'Miguel'
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del alumno',
    example: 'Lopez'
  })
  apellido: string;

  @ApiProperty({
    description: 'Nivel educativo del alumno',
    example: 'SECUNDARIA'
  })
  nivel: string;

  @ApiProperty({
    description: 'Grado del alumno',
    example: 3
  })
  grado: number;

  @ApiProperty({
    description: 'Sección del alumno',
    example: 'A'
  })
  seccion: string;
}

export class AuxiliarEncargadoDto {
  @ApiProperty({
    description: 'ID único del auxiliar',
    example: '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b'
  })
  id_auxiliar: string;

  @ApiProperty({
    description: 'Nombre del auxiliar',
    example: 'Juan'
  })
  nombre: string;

  @ApiProperty({
    description: 'Apellido del auxiliar',
    example: 'Pérez'
  })
  apellido: string;

  @ApiProperty({
    description: 'Correo electrónico del auxiliar',
    example: 'juan.perez@colegio.edu.pe'
  })
  correo_electronico: string;
}

export class JustificacionListResponseDto {
  @ApiProperty({
    description: 'ID único de la justificación',
    example: 'abc123-def456-ghi789'
  })
  id_justificacion: string;

  @ApiProperty({
    description: 'Tipo de justificación',
    enum: TipoJustificacion,
    example: TipoJustificacion.MEDICA
  })
  tipo_justificacion: string;

  @ApiProperty({
    description: 'Motivo de la justificación',
    example: 'Consulta médica por enfermedad respiratoria'
  })
  motivo: string;

  @ApiProperty({
    description: 'Estado actual de la justificación',
    enum: EstadoJustificacion,
    example: EstadoJustificacion.PENDIENTE
  })
  estado: string;

  @ApiProperty({
    description: 'Fecha de creación de la solicitud',
    example: '2025-08-22T21:47:14.580Z'
  })
  fecha_solicitud: Date;

  @ApiProperty({
    description: 'Array de fechas justificadas',
    example: ['22-08-2025', '23-08-2025', '24-08-2025']
  })
  fechas_de_justificacion: string[];

  @ApiPropertyOptional({
    description: 'Array de documentos adjuntos',
    example: ['receta_medica.pdf', 'certificado_medico.pdf']
  })
  documentos_adjuntos?: string[];

  @ApiPropertyOptional({
    description: 'Fecha de respuesta de la justificación'
  })
  fecha_respuesta?: Date;

  @ApiPropertyOptional({
    description: 'Observaciones adicionales del solicitante'
  })
  observaciones_solicitante?: string;

  @ApiProperty({
    description: 'Información del alumno solicitante',
    type: AlumnoSolicitanteDto
  })
  alumno_solicitante: AlumnoSolicitanteDto;

  @ApiProperty({
    description: 'Información del auxiliar encargado',
    type: AuxiliarEncargadoDto
  })
  auxiliar_encargado: AuxiliarEncargadoDto;

  @ApiPropertyOptional({
    description: 'Número de asistencias creadas a partir de esta justificación',
    example: 3
  })
  asistencias_creadas?: number;
}

export class PaginacionResponseDto {
  @ApiProperty({
    description: 'Número de página actual',
    example: 1
  })
  pagina_actual: number;

  @ApiProperty({
    description: 'Número de elementos por página',
    example: 10
  })
  elementos_por_pagina: number;

  @ApiProperty({
    description: 'Total de elementos disponibles',
    example: 25
  })
  total_elementos: number;

  @ApiProperty({
    description: 'Total de páginas disponibles',
    example: 3
  })
  total_paginas: number;

  @ApiProperty({
    description: 'Indica si hay página anterior',
    example: false
  })
  tiene_pagina_anterior: boolean;

  @ApiProperty({
    description: 'Indica si hay página siguiente',
    example: true
  })
  tiene_pagina_siguiente: boolean;
}

export class JustificacionesResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 200
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje descriptivo',
    example: 'Justificaciones obtenidas exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'Array de justificaciones',
    type: [JustificacionListResponseDto]
  })
  data: JustificacionListResponseDto[];

  @ApiProperty({
    description: 'Total de registros encontrados',
    example: 25
  })
  total: number;

  @ApiProperty({
    description: 'Información de paginación',
    type: PaginacionResponseDto
  })
  paginacion: PaginacionResponseDto;
}
