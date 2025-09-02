import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody, ApiHeader, ApiParam } from '@nestjs/swagger';
import { TurnoExtraService, CreateTurnoExtraDto, UpdateTurnoExtraDto } from './turno-extra.service';
import { TurnoExtra, EstadoTurnoExtra } from './turno-extra.entity';

@ApiTags('Turnos Extra')
@Controller('turnos-extra')
export class TurnoExtraController {
  constructor(private readonly turnoExtraService: TurnoExtraService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo turno extra',
    description: 'Crea un turno extra para un alumno en horarios fuera de su turno regular'
  })
  @ApiBody({
    type: 'object',
    description: 'Datos para crear el turno extra',
    schema: {
      type: 'object',
      required: ['alumno_id', 'fecha_turno', 'fecha_limite', 'hora_entrada', 'hora_salida', 'hora_limite', 'observaciones', 'usuario_id'],
      properties: {
        alumno_id: { type: 'string', format: 'uuid', description: 'ID del alumno' },
        fecha_turno: { type: 'string', format: 'date', description: 'Fecha del turno extra' },
        fecha_limite: { type: 'string', format: 'date', description: 'Fecha límite de validez' },
        hora_entrada: { type: 'string', format: 'time', description: 'Hora de entrada programada' },
        hora_salida: { type: 'string', format: 'time', description: 'Hora de salida programada' },
        hora_limite: { type: 'string', format: 'time', description: 'Hora límite para estar presente' },
        observaciones: { type: 'string', description: 'Motivo/observaciones del turno extra' },
        usuario_id: { type: 'string', format: 'uuid', description: 'ID del usuario que crea el turno' }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Turno extra creado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Turno extra creado exitosamente' },
        data: { $ref: '#/components/schemas/TurnoExtra' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o conflicto de horarios'
  })
  @ApiResponse({
    status: 404,
    description: 'Alumno o usuario no encontrado'
  })
  async create(@Body() createDto: CreateTurnoExtraDto) {
    const turnoExtra = await this.turnoExtraService.create(createDto);
    
    return {
      success: true,
      message: 'Turno extra creado exitosamente',
      data: turnoExtra,
      timestamp: new Date().toISOString()
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los turnos extra',
    description: 'Obtiene la lista de todos los turnos extra con información del alumno y usuario'
  })
  @ApiResponse({
    status: 200,
    description: 'Turnos extra obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Turnos extra obtenidos exitosamente' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TurnoExtra' }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  async findAll() {
    const turnosExtra = await this.turnoExtraService.findAll();
    
    return {
      success: true,
      message: 'Turnos extra obtenidos exitosamente',
      data: turnosExtra,
      timestamp: new Date().toISOString()
    };
  }

  @Get('alumno/:alumno_id')
  @ApiOperation({
    summary: 'Obtener turnos extra de un alumno específico',
    description: 'Obtiene todos los turnos extra de un alumno en particular'
  })
  @ApiParam({
    name: 'alumno_id',
    type: 'string',
    format: 'uuid',
    description: 'ID del alumno'
  })
  @ApiResponse({
    status: 200,
    description: 'Turnos extra del alumno obtenidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Turnos extra del alumno obtenidos exitosamente' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/TurnoExtra' }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Alumno no encontrado'
  })
  async findByAlumno(@Param('alumno_id', ParseUUIDPipe) alumno_id: string) {
    const turnosExtra = await this.turnoExtraService.findByAlumno(alumno_id);
    
    return {
      success: true,
      message: 'Turnos extra del alumno obtenidos exitosamente',
      data: turnosExtra,
      timestamp: new Date().toISOString()
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un turno extra por ID',
    description: 'Obtiene un turno extra específico por su ID'
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID del turno extra'
  })
  @ApiResponse({
    status: 200,
    description: 'Turno extra obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Turno extra obtenido exitosamente' },
        data: { $ref: '#/components/schemas/TurnoExtra' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Turno extra no encontrado'
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const turnoExtra = await this.turnoExtraService.findOne(id);
    
    return {
      success: true,
      message: 'Turno extra obtenido exitosamente',
      data: turnoExtra,
      timestamp: new Date().toISOString()
    };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un turno extra',
    description: 'Actualiza un turno extra existente (fecha, horas, estado)'
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID del turno extra'
  })
  @ApiBody({
    type: 'object',
    description: 'Datos para actualizar el turno extra',
    schema: {
      type: 'object',
      properties: {
        fecha_turno: { type: 'string', format: 'date', description: 'Nueva fecha del turno' },
        fecha_limite: { type: 'string', format: 'date', description: 'Nueva fecha límite' },
        hora_entrada: { type: 'string', format: 'time', description: 'Nueva hora de entrada' },
        hora_salida: { type: 'string', format: 'time', description: 'Nueva hora de salida' },
        hora_limite: { type: 'string', format: 'time', description: 'Nueva hora límite' },
        estado: { type: 'string', enum: ['ACTIVO', 'EXPIRADO'], description: 'Nuevo estado' }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Turno extra actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Turno extra actualizado exitosamente' },
        data: { $ref: '#/components/schemas/TurnoExtra' },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o conflicto de horarios'
  })
  @ApiResponse({
    status: 404,
    description: 'Turno extra no encontrado'
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTurnoExtraDto
  ) {
    const turnoExtra = await this.turnoExtraService.update(id, updateDto);
    
    return {
      success: true,
      message: 'Turno extra actualizado exitosamente',
      data: turnoExtra,
      timestamp: new Date().toISOString()
    };
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un turno extra',
    description: 'Elimina un turno extra (solo si está en estado EXPIRADO)'
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'ID del turno extra'
  })
  @ApiResponse({
    status: 200,
    description: 'Turno extra eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Turno extra eliminado exitosamente' },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Turno extra eliminado exitosamente' }
          }
        },
        timestamp: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'No se puede eliminar un turno extra que no esté expirado'
  })
  @ApiResponse({
    status: 404,
    description: 'Turno extra no encontrado'
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const resultado = await this.turnoExtraService.remove(id);
    
    return {
      success: true,
      message: 'Turno extra eliminado exitosamente',
      data: resultado,
      timestamp: new Date().toISOString()
    };
  }
}
