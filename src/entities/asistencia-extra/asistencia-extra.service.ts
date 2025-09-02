import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { AsistenciaExtraRepository } from './asistencia-extra.repository';
import { AsistenciaExtra } from './asistencia-extra.entity';
import { EstadoAsistenciaExtra } from './enums/estado-asistencia-extra.enum';
import { TelegramNotificationService } from '../telegram/services/telegram-notification.service';

export interface CreateAsistenciaExtraDto {
  alumno_id: string;
  fecha: Date;
  hora_de_llegada: string;
  hora_limite: string;
  observaciones?: string;
}

export interface UpdateAsistenciaExtraDto {
  estado_asistencia?: EstadoAsistenciaExtra;
  hora_salida?: string;
  observaciones?: string;
}

@Injectable()
export class AsistenciaExtraService {
  private readonly logger = new Logger(AsistenciaExtraService.name);

  constructor(
    private readonly asistenciaExtraRepo: AsistenciaExtraRepository,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  /**
   * Crear nueva asistencia extra
   */
  async create(createDto: CreateAsistenciaExtraDto, alumno: any): Promise<AsistenciaExtra> {
    try {
      this.logger.log(`📝 Creando asistencia extra para alumno: ${alumno.id_alumno}`);

      // Determinar el estado basado en la hora de llegada vs hora límite
      const estado = this.determinarEstadoAsistencia(
        createDto.hora_de_llegada,
        createDto.hora_limite
      );

      const nuevaAsistenciaExtra = this.asistenciaExtraRepo.create({
        alumno,
        fecha: createDto.fecha,
        hora_de_llegada: createDto.hora_de_llegada,
        hora_salida: null,
        estado_asistencia: estado,
        observaciones: createDto.observaciones || null,
      });

      const asistenciaGuardada = await this.asistenciaExtraRepo.save(nuevaAsistenciaExtra);
      
      this.logger.log(`✅ Asistencia extra creada exitosamente: ${asistenciaGuardada.id_asistencia_extra}`);
      
      // Enviar notificación de Telegram al apoderado
      await this.telegramNotificationService.notificarAsistenciaApoderado(asistenciaGuardada);
      
      return asistenciaGuardada;

    } catch (error) {
      this.logger.error(`❌ Error creando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener todas las asistencias extra
   */
  async findAll(): Promise<AsistenciaExtra[]> {
    try {
      this.logger.log(`🔍 Obteniendo todas las asistencias extra`);
      
      const asistenciasExtra = await this.asistenciaExtraRepo.findAllWithAlumnoYTurno();
      
      this.logger.log(`✅ Encontradas ${asistenciasExtra.length} asistencias extra`);
      return asistenciasExtra;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo asistencias extra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verificar si existe asistencia extra para un alumno en una fecha específica
   */
  async findByAlumnoAndDate(id_alumno: string, fecha: Date): Promise<AsistenciaExtra | null> {
    try {
      this.logger.log(`🔍 Verificando asistencia extra para alumno: ${id_alumno} en fecha: ${fecha}`);
      
      const asistenciaExtra = await this.asistenciaExtraRepo.findByAlumnoAndDate(id_alumno, fecha);
      
      this.logger.log(`✅ Verificación completada para alumno: ${id_alumno}`);
      return asistenciaExtra;

    } catch (error) {
      this.logger.error(`❌ Error verificando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtener asistencia extra por ID
   */
  async findOne(id: string): Promise<AsistenciaExtra> {
    try {
      this.logger.log(`🔍 Obteniendo asistencia extra: ${id}`);

      const asistenciaExtra = await this.asistenciaExtraRepo.findOne(id);
      
      if (!asistenciaExtra) {
        throw new NotFoundException(`Asistencia extra con ID ${id} no encontrada`);
      }

      this.logger.log(`✅ Asistencia extra encontrada: ${id}`);
      return asistenciaExtra;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo asistencia extra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Actualizar asistencia extra
   */
  async update(id: string, updateDto: UpdateAsistenciaExtraDto): Promise<AsistenciaExtra> {
    try {
      this.logger.log(`📝 Actualizando asistencia extra: ${id}`);

      // Verificar que existe
      await this.findOne(id);

      // Actualizar
      const asistenciaActualizada = await this.asistenciaExtraRepo.update(id, updateDto);
      
      this.logger.log(`✅ Asistencia extra actualizada exitosamente: ${id}`);
      return asistenciaActualizada;

    } catch (error) {
      this.logger.error(`❌ Error actualizando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Eliminar asistencia extra
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`🗑️ Eliminando asistencia extra: ${id}`);

      // Verificar que existe
      await this.findOne(id);

      // Eliminar
      await this.asistenciaExtraRepo.delete(id);
      
      this.logger.log(`✅ Asistencia extra eliminada exitosamente: ${id}`);
      
      return {
        success: true,
        message: 'Asistencia extra eliminada exitosamente'
      };

    } catch (error) {
      this.logger.error(`❌ Error eliminando asistencia extra: ${error.message}`);
      throw error;
    }
  }

  /**
   * Determinar el estado de asistencia basado en la hora de llegada vs hora límite
   */
  private determinarEstadoAsistencia(horaLlegada: string, horaLimite: string): EstadoAsistenciaExtra {
    const [horaLlegadaMinutos] = horaLlegada.split(':').map(Number);
    const [horaLimiteMinutos] = horaLimite.split(':').map(Number);
    
    if (horaLlegadaMinutos <= horaLimiteMinutos) {
      return EstadoAsistenciaExtra.PUNTUAL_EXTRA;
    } else {
      return EstadoAsistenciaExtra.TARDANZA_EXTRA;
    }
  }

  /**
   * Marcar asistencia extra como ausente
   */
  async marcarComoAusente(id: string, observaciones?: string): Promise<AsistenciaExtra> {
    try {
      this.logger.log(`📝 Marcando asistencia extra como ausente: ${id}`);

      const updateData: UpdateAsistenciaExtraDto = {
        estado_asistencia: EstadoAsistenciaExtra.AUSENTE_EXTRA,
        observaciones: observaciones || 'Marcado como ausente por sistema'
      };

      return await this.update(id, updateData);

    } catch (error) {
      this.logger.error(`❌ Error marcando asistencia extra como ausente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Marcar asistencia extra como justificada
   */
  async marcarComoJustificada(id: string, observaciones: string): Promise<AsistenciaExtra> {
    try {
      this.logger.log(`📝 Marcando asistencia extra como justificada: ${id}`);

      const updateData: UpdateAsistenciaExtraDto = {
        estado_asistencia: EstadoAsistenciaExtra.JUSTIFICADO_EXTRA,
        observaciones
      };

      return await this.update(id, updateData);

    } catch (error) {
      this.logger.error(`❌ Error marcando asistencia extra como justificada: ${error.message}`);
      throw error;
    }
  }

  /**
   * Anular asistencia extra
   */
  async anular(id: string, observaciones: string): Promise<AsistenciaExtra> {
    try {
      this.logger.log(`📝 Anulando asistencia extra: ${id}`);

      const updateData: UpdateAsistenciaExtraDto = {
        estado_asistencia: EstadoAsistenciaExtra.ANULADO_EXTRA,
        observaciones
      };

      return await this.update(id, updateData);

    } catch (error) {
      this.logger.error(`❌ Error anulando asistencia extra: ${error.message}`);
      throw error;
    }
  }
}
