import { ApiProperty } from '@nestjs/swagger';
import { TipoJustificacion, EstadoJustificacion } from '../justificacion.entity';

export class JustificacionResponseDto {
  @ApiProperty({
    description: 'ID único de la justificación',
    example: 'abc123-def456-ghi789'
  })
  id_justificacion: string;

  @ApiProperty({
    description: 'Información del alumno',
    example: {
      id_alumno: '20109a71-510a-4f0e-8d32-51f257b22700',
      nombre: 'Miguel',
      apellido: 'Lopez',
      codigo: '2311682025'
    }
  })
  alumno: {
    id_alumno: string;
    nombre: string;
    apellido: string;
    codigo: string;
  };

  @ApiProperty({
    description: 'Información del auxiliar',
    example: {
      id_auxiliar: '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b',
      nombre: 'Auxiliar',
      apellido: 'Sistema'
    }
  })
  auxiliar: {
    id_auxiliar: string;
    nombre: string;
    apellido: string;
  };

  @ApiProperty({
    description: 'Tipo de justificación',
    enum: TipoJustificacion,
    example: TipoJustificacion.MEDICA
  })
  tipo_justificacion: TipoJustificacion;

  @ApiProperty({
    description: 'Motivo de la justificación',
    example: 'Consulta médica por enfermedad respiratoria'
  })
  motivo: string;

  @ApiProperty({
    description: 'Fechas justificadas',
    example: ['22-08-2025', '23-08-2025', '24-08-2025']
  })
  fecha_de_justificacion: string[];

  @ApiProperty({
    description: 'Documentos adjuntos',
    example: ['receta_medica.pdf', 'certificado_medico.pdf'],
    required: false
  })
  documentos_adjuntos?: string[];

  @ApiProperty({
    description: 'Estado actual de la justificación',
    enum: EstadoJustificacion,
    example: EstadoJustificacion.PENDIENTE
  })
  estado: EstadoJustificacion;

  @ApiProperty({
    description: 'Fecha de creación de la justificación',
    example: '2025-08-22T21:47:14.580Z'
  })
  fecha_creacion: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-08-22T21:47:14.580Z'
  })
  fecha_actualizacion: Date;
}

export class CreateJustificacionResponseDto {
  @ApiProperty({
    description: 'Código de estado HTTP',
    example: 201
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'Solicitud de justificación registrada exitosamente'
  })
  message: string;

  @ApiProperty({
    description: 'Datos de la justificación creada',
    type: JustificacionResponseDto
  })
  data: JustificacionResponseDto;
}
