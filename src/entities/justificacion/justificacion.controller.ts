import { Controller, Post, Get, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateJustificacionDto } from './dto/create-justificacion.dto';
import { CreateJustificacionResponseDto } from './dto/justificacion-response.dto';
import { CreateJustificacionUseCase } from './use-cases/create-justificacion.usecase';
import { ListJustificacionesUseCase } from './use-cases/list-justificaciones.usecase';
import { GetJustificacionesByAlumnoUseCase } from './use-cases/get-justificaciones-by-alumno.usecase';
import { UpdateEstadoJustificacionUseCase } from './use-cases/update-estado-justificacion.usecase';
import { DeleteJustificacionUseCase } from './use-cases/delete-justificacion.usecase';
import { ListJustificacionesQueryDto } from './dto/list-justificaciones.dto';
import { JustificacionesResponseDto, JustificacionListResponseDto } from './dto/list-justificaciones-response.dto';
import { UpdateEstadoJustificacionDto } from './dto/update-estado-justificacion.dto';
import { UpdateEstadoJustificacionResponseDto } from './dto/update-estado-response.dto';

@ApiTags('Justificaciones')
@Controller('detalle-justificaciones')
export class JustificacionController {
  constructor(
    private readonly createJustificacionUseCase: CreateJustificacionUseCase,
    private readonly listJustificacionesUseCase: ListJustificacionesUseCase,
    private readonly getJustificacionesByAlumnoUseCase: GetJustificacionesByAlumnoUseCase,
    private readonly updateEstadoJustificacionUseCase: UpdateEstadoJustificacionUseCase,
    private readonly deleteJustificacionUseCase: DeleteJustificacionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear solicitud de justificación',
    description: 'Crea una nueva solicitud de justificación para un estudiante, especificando fechas, tipo y motivo. Permite fechas pasadas y futuras para justificaciones anticipadas. Permite adjuntar documentos opcionales.'
  })
  @ApiBody({
    type: CreateJustificacionDto,
    description: 'Datos de la justificación a crear',
    examples: {
      justificacionMedica: {
        summary: 'Justificación Médica',
        value: {
          id_alumno: '20109a71-510a-4f0e-8d32-51f257b22700',
          id_auxiliar: '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b',
          fecha_de_justificacion: ['22-08-2025', '23-08-2025', '24-08-2025'],
          tipo_justificacion: 'MEDICA',
          motivo: 'Consulta médica por enfermedad respiratoria',
          documentos_adjuntos: ['receta_medica.pdf', 'certificado_medico.pdf']
        }
      },
      justificacionFamiliar: {
        summary: 'Justificación Familiar',
        value: {
          id_alumno: '20109a71-510a-4f0e-8d32-51f257b22700',
          id_auxiliar: '37419ff9-9ce8-4b1a-bdc6-2ed28ae8cc0b',
          fecha_de_justificacion: ['25-08-2025'],
          tipo_justificacion: 'FAMILIAR',
          motivo: 'Fallecimiento de familiar cercano, asistencia al funeral',
          documentos_adjuntos: []
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Justificación creada exitosamente',
    type: CreateJustificacionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Error en los datos proporcionados o validación fallida'
  })
  @ApiResponse({
    status: 404,
    description: 'Alumno o auxiliar no encontrado'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async createJustificacion(
    @Body() createJustificacionDto: CreateJustificacionDto
  ): Promise<CreateJustificacionResponseDto> {
    const justificacion = await this.createJustificacionUseCase.execute(createJustificacionDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Solicitud de justificación registrada exitosamente',
      data: justificacion
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar todas las justificaciones',
    description: 'Obtiene todas las justificaciones del sistema con filtros opcionales y paginación. Permite filtrar por alumno, estado, tipo y rango de fechas.'
  })
  @ApiQuery({
    name: 'codigo_alumno',
    description: 'Código del alumno para filtrar',
    required: false,
    type: String
  })
  @ApiQuery({
    name: 'estado',
    description: 'Estado de la justificación para filtrar',
    required: false,
    enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'EN_REVISION']
  })
  @ApiQuery({
    name: 'tipo_justificacion',
    description: 'Tipo de justificación para filtrar',
    required: false,
    enum: ['MEDICA', 'FAMILIAR', 'ACADEMICA', 'PERSONAL', 'EMERGENCIA']
  })
  @ApiQuery({
    name: 'fecha_desde',
    description: 'Fecha de inicio para filtrar (YYYY-MM-DD)',
    required: false,
    type: String
  })
  @ApiQuery({
    name: 'fecha_hasta',
    description: 'Fecha de fin para filtrar (YYYY-MM-DD)',
    required: false,
    type: String
  })
  @ApiQuery({
    name: 'pagina',
    description: 'Número de página (comienza en 1)',
    required: false,
    type: Number,
    example: 1
  })
  @ApiQuery({
    name: 'elementos_por_pagina',
    description: 'Número de elementos por página',
    required: false,
    type: Number,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Justificaciones obtenidas exitosamente',
    type: JustificacionesResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Error en los parámetros de filtrado o paginación'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async listJustificaciones(
    @Query() query: ListJustificacionesQueryDto
  ): Promise<JustificacionesResponseDto> {
    const { 
      codigo_alumno, 
      estado, 
      tipo_justificacion, 
      fecha_desde, 
      fecha_hasta,
      pagina = 1,
      elementos_por_pagina = 10
    } = query;

    const filtros = {
      codigo_alumno,
      estado,
      tipo_justificacion,
      fecha_desde,
      fecha_hasta,
    };

    const paginacion = {
      pagina,
      elementos_por_pagina,
    };

    const result = await this.listJustificacionesUseCase.execute(filtros, paginacion);

    return {
      statusCode: HttpStatus.OK,
      message: 'Justificaciones obtenidas exitosamente',
      data: result.justificaciones,
      total: result.total,
      paginacion: result.paginacion,
    };
  }

  @Get('alumno/:id_alumno')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener justificaciones de un alumno específico',
    description: 'Obtiene todas las justificaciones de un alumno específico por su ID.'
  })
  @ApiParam({
    name: 'id_alumno',
    description: 'ID único del alumno',
    example: '20109a71-510a-4f0e-8d32-51f257b22700'
  })
  @ApiResponse({
    status: 200,
    description: 'Justificaciones del alumno obtenidas exitosamente',
    type: [JustificacionListResponseDto]
  })
  @ApiResponse({
    status: 404,
    description: 'Alumno no encontrado'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async getJustificacionesByAlumno(
    @Param('id_alumno') idAlumno: string
  ): Promise<JustificacionListResponseDto[]> {
    return await this.getJustificacionesByAlumnoUseCase.execute(idAlumno);
  }

  @Put(':id_justificacion/estado')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar estado de justificación',
    description: 'Permite a los auxiliares aprobar o rechazar justificaciones pendientes, con observaciones opcionales. Solo se pueden actualizar justificaciones con estado PENDIENTE.'
  })
  @ApiParam({
    name: 'id_justificacion',
    description: 'ID único de la justificación a actualizar',
    example: 'abc123-def456-ghi789'
  })
  @ApiBody({
    type: UpdateEstadoJustificacionDto,
    description: 'Datos para actualizar el estado de la justificación',
    examples: {
      aprobarConObservaciones: {
        summary: 'Aprobar con observaciones',
        value: {
          nuevo_estado: 'APROBADA',
          observaciones_respuesta: 'Justificación médica válida, documentos correctos'
        }
      },
      rechazarSinObservaciones: {
        summary: 'Rechazar sin observaciones',
        value: {
          nuevo_estado: 'RECHAZADA'
        }
      },
      rechazarConObservaciones: {
        summary: 'Rechazar con observaciones',
        value: {
          nuevo_estado: 'RECHAZADA',
          observaciones_respuesta: 'Documentación insuficiente, faltan certificados médicos'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de justificación actualizado exitosamente',
    type: UpdateEstadoJustificacionResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Error en los datos proporcionados o justificación no es PENDIENTE'
  })
  @ApiResponse({
    status: 404,
    description: 'Justificación no encontrada'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async updateEstadoJustificacion(
    @Param('id_justificacion') idJustificacion: string,
    @Body() updateDto: UpdateEstadoJustificacionDto
  ): Promise<UpdateEstadoJustificacionResponseDto> {
    const justificacionActualizada = await this.updateEstadoJustificacionUseCase.execute(
      idJustificacion,
      updateDto
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Estado de justificación actualizado exitosamente',
      data: justificacionActualizada,
    };
  }

  @Delete(':id_justificacion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar justificación',
    description: 'Elimina una justificación específica del sistema por su ID. Esta acción es irreversible.'
  })
  @ApiParam({
    name: 'id_justificacion',
    description: 'ID único de la justificación a eliminar',
    example: 'abc123-def456-ghi789'
  })
  @ApiResponse({
    status: 200,
    description: 'Justificación eliminada exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: true
        },
        message: {
          type: 'string',
          example: 'Justificación eliminada exitosamente'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Error en los datos proporcionados'
  })
  @ApiResponse({
    status: 404,
    description: 'Justificación no encontrada'
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor'
  })
  async deleteJustificacion(
    @Param('id_justificacion') idJustificacion: string
  ): Promise<{ success: boolean; message: string }> {
    return await this.deleteJustificacionUseCase.execute(idJustificacion);
  }
}
