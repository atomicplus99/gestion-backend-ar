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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificacionService, NotificacionFiltersDto } from '../services/notificacion.service';
import { TipoNotificacion, PrioridadNotificacion, EstadoNotificacion } from '../notificacion.entity';
import { NotificacionGateway } from '../gateways/notificacion.gateway';

@ApiTags('Notificaciones')
@Controller('notificaciones')
export class NotificacionController {
  constructor(
    private readonly notificacionService: NotificacionService,
    private readonly notificacionGateway: NotificacionGateway,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Obtener notificaciones con filtros y paginación',
    description: 'Obtiene todas las notificaciones con filtros opcionales y paginación'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificaciones obtenidas exitosamente'
  })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoNotificacion, description: 'Filtrar por tipo de notificación' })
  @ApiQuery({ name: 'prioridad', required: false, enum: PrioridadNotificacion, description: 'Filtrar por prioridad' })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoNotificacion, description: 'Filtrar por estado' })
  @ApiQuery({ name: 'usuario_id', required: false, type: String, description: 'Filtrar por usuario específico' })
  @ApiQuery({ name: 'fecha_desde', required: false, type: String, description: 'Fecha desde (YYYY-MM-DD)' })
  @ApiQuery({ name: 'fecha_hasta', required: false, type: String, description: 'Fecha hasta (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Número de página (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Límite por página (default: 10, max: 100)' })
  async findAll(
    @Query('tipo') tipo?: TipoNotificacion,
    @Query('prioridad') prioridad?: PrioridadNotificacion,
    @Query('estado') estado?: EstadoNotificacion,
    @Query('usuario_id') usuario_id?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const filters: NotificacionFiltersDto = {
      tipo,
      prioridad,
      estado,
      usuario_id,
      fecha_desde,
      fecha_hasta,
      page,
      limit
    };

    return await this.notificacionService.findAll(filters);
  }

  @Get('unread-count')
  @ApiOperation({ 
    summary: 'Obtener contador de notificaciones no leídas',
    description: 'Obtiene el número de notificaciones no leídas para un usuario específico o globalmente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contador obtenido exitosamente'
  })
  @ApiQuery({ name: 'usuario_id', required: false, type: String, description: 'ID del usuario (opcional)' })
  async getUnreadCount(@Query('usuario_id') usuario_id?: string) {
    const count = await this.notificacionService.getUnreadCount(usuario_id);
    
    return {
      success: true,
      message: 'Contador de notificaciones no leídas obtenido exitosamente',
      data: {
        count,
        usuario_id,
        timestamp: new Date().toISOString()
      }
    };
  }

  @Get('contador')
  @ApiOperation({ 
    summary: 'Obtener contador de notificaciones no leídas (español)',
    description: 'Obtiene el número de notificaciones no leídas - endpoint en español'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Contador obtenido exitosamente'
  })
  @ApiQuery({ name: 'usuario_id', required: false, type: String, description: 'ID del usuario (opcional)' })
  async getContador(@Query('usuario_id') usuario_id?: string) {
    const count = await this.notificacionService.getUnreadCount(usuario_id);
    
    return {
      success: true,
      message: 'Contador de notificaciones obtenido exitosamente',
      data: {
        total_no_leidas: count,
        por_tipo: {
          SCHEDULER: 0, // Por ahora hardcodeado, se puede mejorar después
          JUSTIFICACION: 0,
          SISTEMA: 0
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  @Get('test-gateway')
  @ApiOperation({ 
    summary: 'Probar conexiones del gateway',
    description: 'Endpoint para verificar el estado del gateway de WebSocket'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Estado del gateway obtenido exitosamente'
  })
  async testGateway() {
    const stats = this.notificacionGateway.getConnectionStats();
    
    return {
      success: true,
      message: 'Estado del gateway obtenido exitosamente',
      data: {
        ...stats,
        gateway_initialized: !!this.notificacionGateway,
        timestamp: new Date().toISOString()
      }
    };
  }

  @Patch(':id/marcar-leida')
  @ApiOperation({ 
    summary: 'Marcar notificación como leída y eliminarla (español)',
    description: 'Marca una notificación como leída y la elimina de la base de datos - endpoint en español'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación leída y eliminada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notificación no encontrada'
  })
  @ApiParam({ name: 'id', type: String, description: 'ID de la notificación' })
  async marcarComoLeida(@Param('id', ParseUUIDPipe) id: string) {
    // Primero verificamos que la notificación existe
    const notificacion = await this.notificacionService.findOne(id);
    
    if (!notificacion) {
      throw new Error('Notificación no encontrada');
    }
    
    // Eliminamos la notificación directamente
    await this.notificacionService.remove(id);
    
    return {
      success: true,
      message: 'Notificación leída y eliminada exitosamente',
      data: {
        notificacion: {
          id: id,
          eliminada: true
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  @Patch(':id/mark-read')
  @ApiOperation({ 
    summary: 'Marcar notificación como leída',
    description: 'Marca una notificación específica como leída'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación marcada como leída exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notificación no encontrada'
  })
  @ApiParam({ name: 'id', type: String, description: 'ID de la notificación' })
  async markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    const notificacion = await this.notificacionService.markAsRead(id);
    
    return {
      success: true,
      message: 'Notificación marcada como leída exitosamente',
      data: notificacion
    };
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Obtener notificación por ID',
    description: 'Obtiene una notificación específica por su ID'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación obtenida exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notificación no encontrada'
  })
  @ApiParam({ name: 'id', type: String, description: 'ID de la notificación' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Implementar método findOne en el servicio si es necesario
    return {
      success: true,
      message: 'Notificación obtenida exitosamente',
      data: { id }
    };
  }

  @Patch('mark-all-read')
  @ApiOperation({ 
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones como leídas para un usuario específico o globalmente'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Todas las notificaciones marcadas como leídas exitosamente'
  })
  @ApiQuery({ name: 'usuario_id', required: false, type: String, description: 'ID del usuario (opcional)' })
  async markAllAsRead(@Query('usuario_id') usuario_id?: string) {
    await this.notificacionService.markAllAsRead(usuario_id);
    
    return {
      success: true,
      message: 'Todas las notificaciones marcadas como leídas exitosamente',
      data: {
        usuario_id,
        timestamp: new Date().toISOString()
      }
    };
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Eliminar notificación',
    description: 'Elimina una notificación específica'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Notificación eliminada exitosamente'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Notificación no encontrada'
  })
  @ApiParam({ name: 'id', type: String, description: 'ID de la notificación' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.notificacionService.remove(id);
    
    return {
      success: true,
      message: 'Notificación eliminada exitosamente',
      data: { id }
    };
  }

  @Post('test-scheduler')
  @ApiOperation({ 
    summary: 'Crear notificación de prueba para scheduler',
    description: 'Endpoint de prueba para crear una notificación de scheduler'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Notificación de prueba creada exitosamente'
  })
  async createTestSchedulerNotification() {
    const notificacion = await this.notificacionService.createSchedulerNotification({
      ausencias_procesadas: 15,
      errores: 0,
      tiempo_ejecucion: '2.5s',
      alumnos_afectados: 12,
      estado: 'exitoso'
    });
    
    // Enviar notificación en tiempo real
    await this.notificacionGateway.broadcastNotification(notificacion);
    
    return {
      success: true,
      message: 'Notificación de prueba creada exitosamente',
      data: notificacion
    };
  }
}
