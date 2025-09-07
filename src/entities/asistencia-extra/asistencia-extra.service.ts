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
      
      
      // Enviar notificación de Telegram al apoderado
      await this.telegramNotificationService.notificarAsistenciaApoderado(asistenciaGuardada);
      
      return asistenciaGuardada;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener todas las asistencias extra
   */
  async findAll(): Promise<AsistenciaExtra[]> {
    try {
      
      const asistenciasExtra = await this.asistenciaExtraRepo.findAllWithAlumnoYTurno();
      
      return asistenciasExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Verificar si existe asistencia extra para un alumno en una fecha específica
   */
  async findByAlumnoAndDate(id_alumno: string, fecha: Date): Promise<AsistenciaExtra | null> {
    try {
      
      const asistenciaExtra = await this.asistenciaExtraRepo.findByAlumnoAndDate(id_alumno, fecha);
      
      return asistenciaExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener asistencia extra por ID
   */
  async findOne(id: string): Promise<AsistenciaExtra> {
    try {

      const asistenciaExtra = await this.asistenciaExtraRepo.findOne(id);
      
      if (!asistenciaExtra) {
        throw new NotFoundException(`Asistencia extra con ID ${id} no encontrada`);
      }

      return asistenciaExtra;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualizar asistencia extra
   */
  async update(id: string, updateDto: UpdateAsistenciaExtraDto): Promise<AsistenciaExtra> {
    try {

      // Verificar que existe
      await this.findOne(id);

      // Actualizar
      const asistenciaActualizada = await this.asistenciaExtraRepo.update(id, updateDto);
      
      return asistenciaActualizada;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Eliminar asistencia extra
   */
  async remove(id: string): Promise<{ success: boolean; message: string }> {
    try {

      // Verificar que existe
      await this.findOne(id);

      // Eliminar
      await this.asistenciaExtraRepo.delete(id);
      
      
      return {
        success: true,
        message: 'Asistencia extra eliminada exitosamente'
      };

    } catch (error) {
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

      const updateData: UpdateAsistenciaExtraDto = {
        estado_asistencia: EstadoAsistenciaExtra.AUSENTE_EXTRA,
        observaciones: observaciones || 'Marcado como ausente por sistema'
      };

      return await this.update(id, updateData);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Marcar asistencia extra como justificada
   */
  async marcarComoJustificada(id: string, observaciones: string): Promise<AsistenciaExtra> {
    try {

      const updateData: UpdateAsistenciaExtraDto = {
        estado_asistencia: EstadoAsistenciaExtra.JUSTIFICADO_EXTRA,
        observaciones
      };

      return await this.update(id, updateData);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Anular asistencia extra
   */
  async anular(id: string, observaciones: string): Promise<AsistenciaExtra> {
    try {

      const updateData: UpdateAsistenciaExtraDto = {
        estado_asistencia: EstadoAsistenciaExtra.ANULADO_EXTRA,
        observaciones
      };

      return await this.update(id, updateData);

    } catch (error) {
      throw error;
    }
  }
}
