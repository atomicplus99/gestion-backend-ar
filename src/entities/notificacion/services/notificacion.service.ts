import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion, TipoNotificacion, PrioridadNotificacion, EstadoNotificacion } from '../notificacion.entity';

export interface CreateNotificacionDto {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad?: PrioridadNotificacion;
  icono?: string;
  detalles?: any;
  usuario_id?: string;
}

export interface NotificacionFiltersDto {
  tipo?: TipoNotificacion;
  prioridad?: PrioridadNotificacion;
  estado?: EstadoNotificacion;
  usuario_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class NotificacionService {
  private readonly logger = new Logger(NotificacionService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
  ) {}

  /**
   * Crear una nueva notificación
   */
  async create(createNotificacionDto: CreateNotificacionDto): Promise<Notificacion> {
    try {
      this.logger.log(`📝 Creando notificación: ${createNotificacionDto.titulo}`);

      const notificacion = this.notificacionRepository.create({
        ...createNotificacionDto,
        prioridad: createNotificacionDto.prioridad || PrioridadNotificacion.MEDIA,
        estado: EstadoNotificacion.NO_LEIDA,
        fecha_creacion: new Date()
      });

      const savedNotificacion = await this.notificacionRepository.save(notificacion);
      
      this.logger.log(`✅ Notificación creada exitosamente: ${savedNotificacion.id}`);
      return savedNotificacion;

    } catch (error) {
      this.logger.error(`❌ Error creando notificación: ${error.message}`);
      throw error;
    }
  }

    /**
   * Crear notificación de scheduler
   */
  async createSchedulerNotification(detalles: {
    ausencias_procesadas: number;
    errores: number;
    tiempo_ejecucion: string;
    alumnos_afectados: number;
    estado: 'exitoso' | 'error' | 'advertencia';
    usuario_programador?: any;
  }): Promise<Notificacion> {
    try {
      const { ausencias_procesadas, errores, tiempo_ejecucion, alumnos_afectados, estado, usuario_programador } = detalles;

      let titulo: string;
      let mensaje: string;
      let prioridad: PrioridadNotificacion;
      let icono: string;

      const nombreUsuario = usuario_programador ? `${usuario_programador.nombre} ${usuario_programador.apellido}` : 'Sistema';

      switch (estado) {
        case 'exitoso':
          titulo = `Scheduler ejecutado exitosamente por ${nombreUsuario}`;
          mensaje = `Se procesaron ${ausencias_procesadas} ausencias automáticas programadas por ${nombreUsuario}`;
          prioridad = PrioridadNotificacion.MEDIA;
          icono = '✅';
          break;
        case 'error':
          titulo = `Error en scheduler programado por ${nombreUsuario}`;
          mensaje = `Error procesando ausencias programadas por ${nombreUsuario}: ${errores} errores encontrados`;
          prioridad = PrioridadNotificacion.CRITICA;
          icono = '❌';
          break;
        case 'advertencia':
          titulo = `Scheduler con advertencias programado por ${nombreUsuario}`;
          mensaje = `Se procesaron ${ausencias_procesadas} ausencias programadas por ${nombreUsuario} con ${errores} errores`;
          prioridad = PrioridadNotificacion.ALTA;
          icono = '⚠️';
          break;
        default:
          titulo = `Scheduler ejecutado por ${nombreUsuario}`;
          mensaje = `Proceso completado por ${nombreUsuario}`;
          prioridad = PrioridadNotificacion.MEDIA;
          icono = '📋';
      }

      return await this.create({
        tipo: TipoNotificacion.SCHEDULER,
        titulo,
        mensaje,
        prioridad,
        icono,
        detalles: {
          ausencias_procesadas,
          errores,
          tiempo_ejecucion,
          alumnos_afectados,
          estado,
          usuario_programador: usuario_programador ? {
            id: usuario_programador.id,
            nombre_usuario: usuario_programador.nombre_usuario,
            rol: usuario_programador.rol,
            nombre: usuario_programador.nombre,
            apellido: usuario_programador.apellido
          } : null,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      this.logger.error(`❌ Error creando notificación de scheduler: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener notificaciones con filtros
   */
  async findAll(filters: NotificacionFiltersDto = {}) {
    try {
      const {
        tipo,
        prioridad,
        estado,
        usuario_id,
        fecha_desde,
        fecha_hasta,
        page = 1,
        limit = 10
      } = filters;

      this.logger.log(`🔍 Buscando notificaciones con filtros: ${JSON.stringify(filters)}`);

      const queryBuilder = this.notificacionRepository.createQueryBuilder('notificacion')
        .leftJoinAndSelect('notificacion.usuario', 'usuario')
        .orderBy('notificacion.fecha_creacion', 'DESC');

      // Aplicar filtros
      if (tipo) {
        queryBuilder.andWhere('notificacion.tipo = :tipo', { tipo });
      }

      if (prioridad) {
        queryBuilder.andWhere('notificacion.prioridad = :prioridad', { prioridad });
      }

      if (estado) {
        queryBuilder.andWhere('notificacion.estado = :estado', { estado });
      }

      if (usuario_id) {
        queryBuilder.andWhere('notificacion.usuario_id = :usuario_id', { usuario_id });
      }

      if (fecha_desde) {
        queryBuilder.andWhere('notificacion.fecha_creacion >= :fecha_desde', { fecha_desde });
      }

      if (fecha_hasta) {
        queryBuilder.andWhere('notificacion.fecha_creacion <= :fecha_hasta', { fecha_hasta });
      }

      // Paginación
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [notificaciones, total] = await queryBuilder.getManyAndCount();

      this.logger.log(`✅ Encontradas ${notificaciones.length} notificaciones de ${total} total`);

      return {
        success: true,
        message: 'Notificaciones obtenidas exitosamente',
        data: {
          notificaciones,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      };

    } catch (error) {
      this.logger.error(`❌ Error obteniendo notificaciones: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crear notificación específica para cancelación de programación
   */
  async createCancelacionNotification(detalles: {
    programacion_id: string;
    fecha_programada: string;
    hora_programada: string;
    turnos: string[];
    motivo: string;
    usuario_programador?: any;
  }): Promise<Notificacion> {
    try {
      const nombreUsuario = detalles.usuario_programador ? 
        `${detalles.usuario_programador.nombre} ${detalles.usuario_programador.apellido}` : 
        'Sistema';

      const notificacion = await this.create({
        tipo: TipoNotificacion.SCHEDULER,
        titulo: `Programación cancelada - ${nombreUsuario}`,
        mensaje: `La programación de ausencias masivas para el ${detalles.fecha_programada} a las ${detalles.hora_programada} fue cancelada. Motivo: ${detalles.motivo}`,
        prioridad: PrioridadNotificacion.ALTA,
        icono: 'cancel',
        detalles: {
          tipo_evento: 'cancelacion_programacion',
          programacion_id: detalles.programacion_id,
          fecha_programada: detalles.fecha_programada,
          hora_programada: detalles.hora_programada,
          turnos: detalles.turnos,
          motivo: detalles.motivo,
          usuario_programador: detalles.usuario_programador ? {
            id: detalles.usuario_programador.id,
            nombre_usuario: detalles.usuario_programador.nombre_usuario,
            rol: detalles.usuario_programador.rol,
            nombre: detalles.usuario_programador.nombre,
            apellido: detalles.usuario_programador.apellido
          } : null,
          timestamp: new Date().toISOString()
        }
      });

      this.logger.log(`✅ Notificación de cancelación creada: ${notificacion.id}`);
      return notificacion;

    } catch (error) {
      this.logger.error(`❌ Error creando notificación de cancelación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener notificación por ID
   */
  async findOne(id: string): Promise<Notificacion | null> {
    try {
      this.logger.log(`🔍 Buscando notificación: ${id}`);

      const notificacion = await this.notificacionRepository.findOne({
        where: { id }
      });

      if (!notificacion) {
        this.logger.warn(`⚠️ Notificación no encontrada: ${id}`);
        return null;
      }

      this.logger.log(`✅ Notificación encontrada: ${id}`);
      return notificacion;

    } catch (error) {
      this.logger.error(`❌ Error buscando notificación: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(id: string): Promise<Notificacion> {
    try {
      this.logger.log(`📖 Marcando notificación como leída: ${id}`);

      const notificacion = await this.notificacionRepository.findOne({
        where: { id }
      });

      if (!notificacion) {
        throw new Error('Notificación no encontrada');
      }

      notificacion.estado = EstadoNotificacion.LEIDA;
      notificacion.fecha_lectura = new Date();

      const updatedNotificacion = await this.notificacionRepository.save(notificacion);
      
      this.logger.log(`✅ Notificación marcada como leída: ${id}`);
      return updatedNotificacion;

    } catch (error) {
      this.logger.error(`❌ Error marcando notificación como leída: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(usuario_id?: string): Promise<void> {
    try {
      this.logger.log(`📖 Marcando todas las notificaciones como leídas`);

      const queryBuilder = this.notificacionRepository.createQueryBuilder()
        .update(Notificacion)
        .set({
          estado: EstadoNotificacion.LEIDA,
          fecha_lectura: new Date()
        })
        .where('estado = :estado', { estado: EstadoNotificacion.NO_LEIDA });

      if (usuario_id) {
        queryBuilder.andWhere('usuario_id = :usuario_id', { usuario_id });
      }

      const result = await queryBuilder.execute();
      
      this.logger.log(`✅ ${result.affected} notificaciones marcadas como leídas`);

    } catch (error) {
      this.logger.error(`❌ Error marcando todas las notificaciones como leídas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  async getUnreadCount(usuario_id?: string): Promise<number> {
    try {
      const queryBuilder = this.notificacionRepository.createQueryBuilder('notificacion')
        .where('notificacion.estado = :estado', { estado: EstadoNotificacion.NO_LEIDA });

      if (usuario_id) {
        queryBuilder.andWhere('notificacion.usuario_id = :usuario_id', { usuario_id });
      }

      const count = await queryBuilder.getCount();
      return count;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo contador de notificaciones no leídas: ${error.message}`);
      return 0;
    }
  }

  /**
   * Eliminar notificación
   */
  async remove(id: string): Promise<void> {
    try {
      this.logger.log(`🗑️ Eliminando notificación: ${id}`);

      const result = await this.notificacionRepository.delete(id);
      
      if (result.affected === 0) {
        throw new Error('Notificación no encontrada');
      }

      this.logger.log(`✅ Notificación eliminada: ${id}`);

    } catch (error) {
      this.logger.error(`❌ Error eliminando notificación: ${error.message}`);
      throw error;
    }
  }
}
