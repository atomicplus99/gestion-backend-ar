import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateActualizacionAsistenciaCase } from './infraestructure/cases/CreateActualizacionAsistencia.usecase';
import { CreateActualizacionAsistenciaDto } from './domain/dto/ActualizacionAsistencia.dto';
import { ActualizacionesAsistenciaRepository } from './domain/repository/actualizaciones-asistencia.repository';

@ApiTags('Actualizaciones de Asistencia')
@Controller('actualizaciones-asistencia')
// @UseGuards(AuthGuard('jwt'), RolesGuard)
export class ActualizacionAsistenciaController {
  constructor(
    private readonly createCase: CreateActualizacionAsistenciaCase,
    private readonly actualizacionesRepository: ActualizacionesAsistenciaRepository
  ) {}

  @Post("create")
//   @Roles('ADMIN') 
  async create(@Body() dto: CreateActualizacionAsistenciaDto) {
    const nuevaActualizacion = await this.createCase.execute(dto);
    return {
      message: 'Actualización de asistencia registrada exitosamente',
      data: nuevaActualizacion,
    };
  }

  @Get()
  @ApiOperation({ 
    summary: 'Obtener todas las actualizaciones de asistencia',
    description: 'Retorna todas las actualizaciones de asistencia con información detallada de alumnos, auxiliares y asistencias'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de actualizaciones obtenida exitosamente'
  })
  async getAllActualizaciones() {
    const actualizaciones = await this.actualizacionesRepository.findAll();
    return {
      success: true,
      message: 'Actualizaciones obtenidas exitosamente',
      data: actualizaciones,
      count: actualizaciones.length
    };
  }

  @Get('asistencia/:id_asistencia')
  @ApiOperation({ 
    summary: 'Obtener actualizaciones por ID de asistencia',
    description: 'Retorna todas las actualizaciones realizadas para una asistencia específica'
  })
  @ApiParam({ 
    name: 'id_asistencia', 
    description: 'ID de la asistencia',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Actualizaciones de la asistencia obtenidas exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No se encontraron actualizaciones para esta asistencia'
  })
  async getActualizacionesByAsistencia(@Param('id_asistencia') id_asistencia: string) {
    const actualizaciones = await this.actualizacionesRepository.findByAsistenciaId(id_asistencia);
    return {
      success: true,
      message: `Actualizaciones para la asistencia ${id_asistencia}`,
      data: actualizaciones,
      count: actualizaciones.length
    };
  }

  @Get('auxiliar/:id_auxiliar')
  @ApiOperation({ 
    summary: 'Obtener actualizaciones por ID de auxiliar',
    description: 'Retorna todas las actualizaciones realizadas por un auxiliar específico'
  })
  @ApiParam({ 
    name: 'id_auxiliar', 
    description: 'ID del auxiliar',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Actualizaciones del auxiliar obtenidas exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No se encontraron actualizaciones para este auxiliar'
  })
  async getActualizacionesByAuxiliar(@Param('id_auxiliar') id_auxiliar: string) {
    const actualizaciones = await this.actualizacionesRepository.findByAuxiliarId(id_auxiliar);
    return {
      success: true,
      message: `Actualizaciones realizadas por el auxiliar ${id_auxiliar}`,
      data: actualizaciones,
      count: actualizaciones.length
    };
  }

  @Get('alumno/:id_alumno')
  @ApiOperation({ 
    summary: 'Obtener actualizaciones por ID de alumno',
    description: 'Retorna todas las actualizaciones realizadas para un alumno específico'
  })
  @ApiParam({ 
    name: 'id_alumno', 
    description: 'ID del alumno',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Actualizaciones del alumno obtenidas exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'No se encontraron actualizaciones para este alumno'
  })
  async getActualizacionesByAlumno(@Param('id_alumno') id_alumno: string) {
    const actualizaciones = await this.actualizacionesRepository.findByAlumnoId(id_alumno);
    return {
      success: true,
      message: `Actualizaciones para el alumno ${id_alumno}`,
      data: actualizaciones,
      count: actualizaciones.length
    };
  }

  @Get('rango-fechas')
  @ApiOperation({ 
    summary: 'Obtener actualizaciones por rango de fechas',
    description: 'Retorna todas las actualizaciones realizadas dentro de un rango de fechas específico'
  })
  @ApiQuery({ 
    name: 'fecha_inicio', 
    description: 'Fecha de inicio (YYYY-MM-DD)',
    example: '2025-01-01',
    required: true
  })
  @ApiQuery({ 
    name: 'fecha_fin', 
    description: 'Fecha de fin (YYYY-MM-DD)',
    example: '2025-12-31',
    required: true
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Actualizaciones del rango de fechas obtenidas exitosamente'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Fechas inválidas o formato incorrecto'
  })
  async getActualizacionesByDateRange(
    @Query('fecha_inicio') fecha_inicio: string,
    @Query('fecha_fin') fecha_fin: string
  ) {
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);
    
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return {
        success: false,
        message: 'Formato de fechas inválido. Use YYYY-MM-DD',
        error: 'Bad Request'
      };
    }

    const actualizaciones = await this.actualizacionesRepository.findByDateRange(fechaInicio, fechaFin);
    return {
      success: true,
      message: `Actualizaciones del ${fecha_inicio} al ${fecha_fin}`,
      data: actualizaciones,
      count: actualizaciones.length,
      rango: {
        fecha_inicio: fecha_inicio,
        fecha_fin: fecha_fin
      }
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener actualización por ID',
    description: 'Retorna una actualización específica por su ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ID de la actualización',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Actualización obtenida exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Actualización no encontrada'
  })
  async getActualizacionById(@Param('id') id: string) {
    const actualizacion = await this.actualizacionesRepository.findOne(id);
    if (!actualizacion) {
      return {
        success: false,
        message: 'Actualización no encontrada',
        error: 'Not Found'
      };
    }
    return {
      success: true,
      message: 'Actualización obtenida exitosamente',
      data: actualizacion
    };
  }
}
