import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AsistenciaExtraService } from './asistencia-extra.service';
import { CreateAsistenciaExtraDto, UpdateAsistenciaExtraDto } from './asistencia-extra.service';
import { EstadoAsistenciaExtra } from './enums/estado-asistencia-extra.enum';

@ApiTags('Asistencia Extra')
@Controller('asistencia-extra')
export class AsistenciaExtraController {
  private readonly logger = new Logger(AsistenciaExtraController.name);

  constructor(private readonly asistenciaExtraService: AsistenciaExtraService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las asistencias extra' })
  @ApiResponse({ status: 200, description: 'Lista de asistencias extra obtenida exitosamente' })
  async findAll() {
    try {
      const asistenciasExtra = await this.asistenciaExtraService.findAll();
      
      return {
        success: true,
        message: 'Asistencias extra obtenidas exitosamente',
        data: asistenciasExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo asistencias extra: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener asistencia extra por ID' })
  @ApiResponse({ status: 200, description: 'Asistencia extra encontrada exitosamente' })
  @ApiResponse({ status: 404, description: 'Asistencia extra no encontrada' })
  async findOne(@Param('id') id: string) {
    try {
      const asistenciaExtra = await this.asistenciaExtraService.findOne(id);
      
      return {
        success: true,
        message: 'Asistencia extra encontrada exitosamente',
        data: asistenciaExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo asistencia extra: ${error.message}`);
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Crear nueva asistencia extra' })
  @ApiResponse({ status: 201, description: 'Asistencia extra creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createDto: CreateAsistenciaExtraDto) {
    try {
      // TODO: Obtener el alumno real desde el DTO
      const alumno = { id_alumno: createDto.alumno_id };
      
      const asistenciaExtra = await this.asistenciaExtraService.create(createDto, alumno);
      
      return {
        success: true,
        message: 'Asistencia extra creada exitosamente',
        data: asistenciaExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error creando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar asistencia extra' })
  @ApiResponse({ status: 200, description: 'Asistencia extra actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Asistencia extra no encontrada' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateAsistenciaExtraDto) {
    try {
      const asistenciaExtra = await this.asistenciaExtraService.update(id, updateDto);
      
      return {
        success: true,
        message: 'Asistencia extra actualizada exitosamente',
        data: asistenciaExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error actualizando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar asistencia extra' })
  @ApiResponse({ status: 200, description: 'Asistencia extra eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Asistencia extra no encontrada' })
  async remove(@Param('id') id: string) {
    try {
      const resultado = await this.asistenciaExtraService.remove(id);
      
      return {
        success: resultado.success,
        message: resultado.message,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error eliminando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/marcar-ausente')
  @ApiOperation({ summary: 'Marcar asistencia extra como ausente' })
  @ApiResponse({ status: 200, description: 'Asistencia extra marcada como ausente exitosamente' })
  async marcarComoAusente(@Param('id') id: string, @Body() body: { observaciones?: string }) {
    try {
      const asistenciaExtra = await this.asistenciaExtraService.marcarComoAusente(id, body.observaciones);
      
      return {
        success: true,
        message: 'Asistencia extra marcada como ausente exitosamente',
        data: asistenciaExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error marcando asistencia extra como ausente: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/marcar-justificada')
  @ApiOperation({ summary: 'Marcar asistencia extra como justificada' })
  @ApiResponse({ status: 200, description: 'Asistencia extra marcada como justificada exitosamente' })
  async marcarComoJustificada(@Param('id') id: string, @Body() body: { observaciones: string }) {
    try {
      const asistenciaExtra = await this.asistenciaExtraService.marcarComoJustificada(id, body.observaciones);
      
      return {
        success: true,
        message: 'Asistencia extra marcada como justificada exitosamente',
        data: asistenciaExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error marcando asistencia extra como justificada: ${error.message}`);
      throw error;
    }
  }

  @Put(':id/anular')
  @ApiOperation({ summary: 'Anular asistencia extra' })
  @ApiResponse({ status: 200, description: 'Asistencia extra anulada exitosamente' })
  async anular(@Param('id') id: string, @Body() body: { observaciones: string }) {
    try {
      const asistenciaExtra = await this.asistenciaExtraService.anular(id, body.observaciones);
      
      return {
        success: true,
        message: 'Asistencia extra anulada exitosamente',
        data: asistenciaExtra,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`❌ Error anulando asistencia extra: ${error.message}`);
      throw error;
    }
  }
}
