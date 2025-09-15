import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Justificacion } from '../justificacion.entity';
import { Asistencia } from '../../asistencia/asistencia.entity';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAsistencia } from '../../asistencia/enums/estado-asistencia.enum';
import { ActualizacionesAsistencia } from '../../actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';

@Injectable()
export class JustificacionAsistenciaService {
  private readonly logger = new Logger(JustificacionAsistenciaService.name);

  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(ActualizacionesAsistencia)
    private readonly actualizacionesRepository: Repository<ActualizacionesAsistencia>,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  /**
   * Crea o actualiza asistencias para las fechas justificadas cuando se aprueba una justificación
   */
  async procesarAsistenciasJustificadas(justificacion: Justificacion): Promise<void> {
    try {

      // Procesar cada fecha de justificación
      for (const fechaStr of justificacion.fecha_de_justificacion) {
        await this.procesarFechaJustificada(justificacion, fechaStr);
      }

    } catch (error) {
      throw error;
    }
  }

  /**
   * Procesa una fecha específica de justificación
   */
  private async procesarFechaJustificada(justificacion: Justificacion, fechaStr: string): Promise<void> {
    try {
      // Convertir fecha DD-MM-YYYY a Date
      const [dia, mes, anio] = fechaStr.split('-').map(Number);
      const fecha = new Date(anio, mes - 1, dia, 0, 0, 0, 0);

      // Buscar si ya existe una asistencia para esta fecha
      const asistenciaExistente = await this.buscarAsistenciaExistente(
        justificacion.alumno.id_alumno,
        fecha
      );

      if (asistenciaExistente) {
        // Actualizar asistencia existente
        await this.actualizarAsistenciaExistente(asistenciaExistente, justificacion);
      } else {
        // Crear nueva asistencia justificada
        await this.crearAsistenciaJustificada(justificacion, fecha);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca si existe una asistencia para el alumno en la fecha específica
   */
  private async buscarAsistenciaExistente(idAlumno: string, fecha: Date): Promise<Asistencia | null> {
    const fechaInicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 0, 0, 0, 0);
    const fechaFin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59, 999);

    return await this.asistenciaRepository
      .createQueryBuilder('asistencia')
      .leftJoinAndSelect('asistencia.alumno', 'alumno')
      .where('alumno.id_alumno = :idAlumno', { idAlumno })
      .andWhere('asistencia.fecha >= :fechaInicio', { fechaInicio })
      .andWhere('asistencia.fecha <= :fechaFin', { fechaFin })
      .getOne();
  }

  /**
   * Actualiza una asistencia existente a estado JUSTIFICADO
   * Usa la misma estrategia que funcionó con ANULADO: modificar entidad y usar save()
   */
  private async actualizarAsistenciaExistente(asistencia: Asistencia, justificacion: Justificacion): Promise<void> {
    // Modificar directamente la entidad
    asistencia.estado_asistencia = EstadoAsistencia.JUSTIFICADO;
    
    // Guardar la entidad modificada (misma estrategia que ANULADO)
    const asistenciaActualizada = await this.asistenciaRepository.save(asistencia);
    
    // Crear registro de actualización
    const actualizacion = new ActualizacionesAsistencia();
    actualizacion.asistencia = asistenciaActualizada;
    actualizacion.alumno = justificacion.alumno;
    actualizacion.motivo = `JUSTIFICACIÓN APROBADA: ${justificacion.motivo}`;
    actualizacion.accion_realizada = 'APROBAR_JUSTIFICACION';
    
    // Asignar el actor según el tipo de justificación
    if (justificacion.auxiliar) {
      actualizacion.auxiliar = justificacion.auxiliar;
    } else if (justificacion.administrador) {
      actualizacion.administrador = justificacion.administrador;
    } else if (justificacion.director) {
      actualizacion.director = justificacion.director;
    }
    
    await this.actualizacionesRepository.save(actualizacion);
    
    // Enviar notificación por Telegram
    await this.telegramNotificationService.notificarAsistenciaApoderado(
      asistenciaActualizada,
      `JUSTIFICACIÓN APROBADA: ${justificacion.motivo}`,
      'JUSTIFICACION'
    );
  }

  /**
   * Crea una nueva asistencia con estado JUSTIFICADO
   */
  private async crearAsistenciaJustificada(justificacion: Justificacion, fecha: Date): Promise<void> {
    const nuevaAsistencia = this.asistenciaRepository.create({
      alumno: justificacion.alumno,
      fecha: fecha,
      estado_asistencia: EstadoAsistencia.JUSTIFICADO,
      hora_de_llegada: '00:00', // Hora por defecto para asistencias justificadas
      hora_salida: null,
    });

    const asistenciaGuardada = await this.asistenciaRepository.save(nuevaAsistencia);
    
    // Crear registro de actualización
    const actualizacion = new ActualizacionesAsistencia();
    actualizacion.asistencia = asistenciaGuardada;
    actualizacion.alumno = justificacion.alumno;
    actualizacion.motivo = `JUSTIFICACIÓN APROBADA: ${justificacion.motivo}`;
    actualizacion.accion_realizada = 'CREAR_ASISTENCIA_JUSTIFICADA';
    
    // Asignar el actor según el tipo de justificación
    if (justificacion.auxiliar) {
      actualizacion.auxiliar = justificacion.auxiliar;
    } else if (justificacion.administrador) {
      actualizacion.administrador = justificacion.administrador;
    } else if (justificacion.director) {
      actualizacion.director = justificacion.director;
    }
    
    await this.actualizacionesRepository.save(actualizacion);
    
    // Enviar notificación por Telegram
    await this.telegramNotificationService.notificarAsistenciaApoderado(
      asistenciaGuardada,
      `JUSTIFICACIÓN APROBADA: ${justificacion.motivo}`,
      'JUSTIFICACION'
    );
  }
}
