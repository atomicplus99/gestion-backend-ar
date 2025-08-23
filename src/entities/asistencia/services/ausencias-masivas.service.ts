import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Alumno } from '../../alumno/infraestructure/orm/entities/alumno.entity';
import { Asistencia } from '../asistencia.entity';
import { EstadoAsistencia } from '../enums/estado-asistencia.enum';
import { AusenciasMasivasLog } from '../entities/ausencias-masivas-log.entity';

@Injectable()
export class AusenciasMasivasService {
  private readonly logger = new Logger(AusenciasMasivasService.name);

  constructor(
    @InjectRepository(Alumno)
    private readonly alumnoRepository: Repository<Alumno>,
    @InjectRepository(Asistencia)
    private readonly asistenciaRepository: Repository<Asistencia>,
    @InjectRepository(AusenciasMasivasLog)
    private readonly ausenciasMasivasLogRepository: Repository<AusenciasMasivasLog>,
  ) {}

  /**
   * Ejecuta el programa de ausencias masivas para la fecha, hora y turnos especificados
   * Registra ausencias solo para alumnos de los turnos seleccionados que no tengan asistencia
   * 
   * Si se especifica fecha y hora, se programa para ejecución automática
   * Si no se especifica, se ejecuta inmediatamente
   */
  async ejecutarProgramaAusencias(fecha?: Date, hora?: string, turnos?: string[]): Promise<{
    totalAlumnos: number;
    ausenciasCreadas: number;
    alumnosConAsistencia: number;
    fechaProcesada: string;
    horaEjecucion: string;
    horaProgramada: string;
    turnosProcesados: string[];
    programada: boolean;
    idProgramacion?: string;
  }> {
    const horaInicio = new Date();
    const fechaProcesada = fecha || new Date();
    const horaEjecucion = horaInicio.toTimeString().split(' ')[0];
    
    // Si se especifica hora, construir la fecha completa
    let fechaHoraProcesada = fechaProcesada;
    if (hora) {
      const [horas, minutos, segundos] = hora.split(':').map(Number);
      fechaHoraProcesada = new Date(
        fechaProcesada.getFullYear(),
        fechaProcesada.getMonth(),
        fechaProcesada.getDate(),
        horas,
        minutos,
        segundos || 0
      );
    }
    
    try {
      this.logger.log(`🚀 Iniciando programa de ausencias masivas para fecha: ${fechaProcesada.toDateString()}`);

      // 1. Obtener todos los alumnos activos con turno asignado
      const alumnos = await this.alumnoRepository.find({
        relations: ['turno'],
      });

      // 2. Filtrar alumnos por turnos especificados
      const turnosProcesar = turnos || ['MAÑANA', 'TARDE'];
      const alumnosFiltrados = alumnos.filter(alumno => {
        if (!alumno.turno) return false;
        return turnosProcesar.includes(alumno.turno.turno);
      });

      this.logger.log(`📊 Total de alumnos encontrados: ${alumnos.length}`);
      this.logger.log(`🎯 Alumnos del turno(s) ${turnosProcesar.join(', ')}: ${alumnosFiltrados.length}`);

      this.logger.log(`📊 Total de alumnos encontrados: ${alumnos.length}`);

      let ausenciasCreadas = 0;
      let alumnosConAsistencia = 0;

      // 3. Procesar cada alumno del turno especificado
      for (const alumno of alumnosFiltrados) {
        try {
          const resultado = await this.procesarAlumno(alumno, fechaProcesada);
          if (resultado.ausenciaCreada) {
            ausenciasCreadas++;
          } else {
            alumnosConAsistencia++;
          }
        } catch (error) {
          this.logger.error(`❌ Error procesando alumno ${alumno.codigo}: ${error.message}`);
          // Continuar con el siguiente alumno
        }
      }

      const resultado = {
        totalAlumnos: alumnosFiltrados.length,
        ausenciasCreadas,
        alumnosConAsistencia,
        fechaProcesada: fechaProcesada.toDateString(),
        horaEjecucion,
        horaProgramada: hora || horaInicio.toTimeString().split(' ')[0],
        turnosProcesados: turnos || ['MAÑANA', 'TARDE'],
        programada: false,
      };

      this.logger.log(`✅ Programa de ausencias completado: ${JSON.stringify(resultado)}`);
      
      // Guardar historial de la ejecución
      await this.guardarHistorialEjecucion(
        fechaHoraProcesada,
        horaInicio,
        resultado,
        turnos || ['MAÑANA', 'TARDE']
      );
      
      return resultado;

    } catch (error) {
      this.logger.error(`❌ Error en programa de ausencias masivas: ${error.message}`);
      
      // Guardar historial con error
      await this.guardarHistorialEjecucion(
        fechaProcesada,
        horaInicio,
        { totalAlumnos: 0, ausenciasCreadas: 0, alumnosConAsistencia: 0, fechaProcesada: fechaProcesada.toDateString(), horaEjecucion, turnosProcesados: turnos || ['MAÑANA', 'TARDE'] },
        turnos || ['MAÑANA', 'TARDE'],
        'ERROR',
        error.message
      );
      
      throw error;
    }
  }

  /**
   * Procesa un alumno específico para determinar si necesita ausencia
   */
  private async procesarAlumno(alumno: Alumno, fecha: Date): Promise<{
    ausenciaCreada: boolean;
    motivo: string;
  }> {
    try {
      // Verificar si ya tiene asistencia para esta fecha
      const asistenciaExistente = await this.buscarAsistenciaExistente(alumno.id_alumno, fecha);

      if (asistenciaExistente) {
        // Ya tiene asistencia (PUNTUAL, TARDANZA, etc.)
        return { ausenciaCreada: false, motivo: 'Ya tiene asistencia registrada' };
      }

      // Verificar si el alumno tiene turno asignado
      if (!alumno.turno) {
        this.logger.warn(`⚠️ Alumno ${alumno.codigo} sin turno asignado - omitiendo`);
        return { ausenciaCreada: false, motivo: 'Sin turno asignado' };
      }

      // Verificar si la fecha actual está dentro del rango del turno
      const fechaActual = new Date();
      const fechaProcesada = new Date(fecha);
      
      // Solo procesar si es la fecha actual o pasada
      if (fechaProcesada > fechaActual) {
        return { ausenciaCreada: false, motivo: 'Fecha futura - no se procesa' };
      }

      // Crear ausencia
      const nuevaAusencia = this.asistenciaRepository.create({
        alumno,
        fecha: fechaProcesada,
        estado_asistencia: EstadoAsistencia.AUSENTE,
        hora_de_llegada: '00:00', // Hora por defecto para ausencias
        hora_salida: null,
      });

      await this.asistenciaRepository.save(nuevaAusencia);
      
      this.logger.log(`✅ Ausencia creada para alumno ${alumno.codigo} - ${alumno.nombre} ${alumno.apellido}`);
      
      return { ausenciaCreada: true, motivo: 'Ausencia registrada automáticamente' };

    } catch (error) {
      this.logger.error(`❌ Error procesando alumno ${alumno.codigo}: ${error.message}`);
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
   * Obtiene estadísticas del programa de ausencias
   */
  async obtenerEstadisticas(fecha?: Date, turnos?: string[]): Promise<{
    fecha: string;
    totalAlumnos: number;
    ausenciasRegistradas: number;
    asistenciasRegistradas: number;
    alumnosSinAsistencia: number;
    turnosProcesados: string[];
  }> {
    const fechaProcesada = fecha || new Date();
    const fechaInicio = new Date(fechaProcesada.getFullYear(), fechaProcesada.getMonth(), fechaProcesada.getDate(), 0, 0, 0, 0);
    const fechaFin = new Date(fechaProcesada.getFullYear(), fechaProcesada.getMonth(), fechaProcesada.getDate(), 23, 59, 59, 999);

    const totalAlumnos = await this.alumnoRepository.count();

    const asistenciasRegistradas = await this.asistenciaRepository.count({
      where: {
        fecha: Between(fechaInicio, fechaFin)
      }
    });

    const ausenciasRegistradas = await this.asistenciaRepository.count({
      where: {
        fecha: Between(fechaInicio, fechaFin),
        estado_asistencia: EstadoAsistencia.AUSENTE
      }
    });

    const alumnosSinAsistencia = totalAlumnos - asistenciasRegistradas;

    return {
      fecha: fechaProcesada.toDateString(),
      totalAlumnos,
      ausenciasRegistradas,
      asistenciasRegistradas,
      alumnosSinAsistencia,
      turnosProcesados: turnos || ['MAÑANA', 'TARDE'],
    };
  }

  /**
   * Guarda el historial de una ejecución del programa de ausencias
   */
  private async guardarHistorialEjecucion(
    fechaEjecucion: Date,
    horaInicio: Date,
    resultado: any,
    turnosProcesados: string[],
    estado: string = 'COMPLETADO',
    observaciones?: string
  ): Promise<void> {
    try {
      const horaFin = new Date();
      const duracionSegundos = Math.round((horaFin.getTime() - horaInicio.getTime()) / 1000);

      const log = this.ausenciasMasivasLogRepository.create({
        fecha_ejecucion: fechaEjecucion,
        hora_programada: resultado.horaProgramada,
        hora_inicio: horaInicio.toTimeString().split(' ')[0],
        hora_fin: horaFin.toTimeString().split(' ')[0],
        total_alumnos: resultado.totalAlumnos,
        ausencias_creadas: resultado.ausenciasCreadas,
        alumnos_con_asistencia: resultado.alumnosConAsistencia,
        turnos_procesados: turnosProcesados.join(', '),
        estado: estado,
        observaciones: observaciones,
        duracion_segundos: duracionSegundos,
      });

      await this.ausenciasMasivasLogRepository.save(log);
      this.logger.log(`📝 Historial de ejecución guardado: ${log.id_log}`);

    } catch (error) {
      this.logger.error(`❌ Error guardando historial: ${error.message}`);
    }
  }

  /**
   * Programa una ausencia para ejecutarse automáticamente en la fecha y hora especificada
   */
  async programarAusencia(
    fecha: Date,
    hora: string,
    turnos: string[]
  ): Promise<{
    idProgramacion: string;
    fecha: string;
    hora: string;
    turnos: string[];
    mensaje: string;
  }> {
    try {
      this.logger.log(`📅 Programando ausencia para ${fecha.toDateString()} a las ${hora}`);

      // Crear registro de programación
      const log = this.ausenciasMasivasLogRepository.create({
        fecha_ejecucion: fecha,
        hora_programada: hora,
        hora_inicio: null,
        hora_fin: null,
        total_alumnos: 0,
        ausencias_creadas: 0,
        alumnos_con_asistencia: 0,
        turnos_procesados: turnos.join(', '),
        estado: 'PROGRAMADA',
        observaciones: 'Ausencia programada para ejecución automática',
        duracion_segundos: 0,
      } as unknown as AusenciasMasivasLog);

      const resultado = await this.ausenciasMasivasLogRepository.save(log);
      
      this.logger.log(`✅ Ausencia programada exitosamente: ${resultado.id_log}`);
      
      return {
        idProgramacion: resultado.id_log,
        fecha: fecha.toDateString(),
        hora,
        turnos,
        mensaje: `Ausencia programada para ejecutarse automáticamente el ${fecha.toDateString()} a las ${hora}`
      };

    } catch (error) {
      this.logger.error(`❌ Error programando ausencia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene el historial real de ejecuciones del programa de ausencias
   */
  async obtenerHistorial(limite: number = 50): Promise<any[]> {
    try {
      this.logger.log(`📊 Obteniendo historial real de ausencias masivas (límite: ${limite})`);

      const historial = await this.ausenciasMasivasLogRepository.find({
        order: { fecha_creacion: 'DESC' },
        take: limite,
      });

      // Transformar a formato de respuesta
      const historialFormateado = historial.map(log => ({
        fecha: new Date(log.fecha_ejecucion).toLocaleDateString('es-ES'),
        totalAlumnos: log.total_alumnos,
        ausenciasCreadas: log.ausencias_creadas,
        horaEjecucion: log.hora_inicio,
        fechaEjecucion: log.fecha_creacion.toISOString(),
        estado: log.estado,
        duracion: log.duracion_segundos ? `${log.duracion_segundos}s` : 'N/A',
        turnosProcesados: log.turnos_procesados,
      }));

      this.logger.log(`✅ Historial real obtenido: ${historialFormateado.length} registros`);
      return historialFormateado;

    } catch (error) {
      this.logger.error(`❌ Error obteniendo historial: ${error.message}`);
      throw error;
    }
  }
}
