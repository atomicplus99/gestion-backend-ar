import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AusenciasMasivasService } from './ausencias-masivas.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AusenciasMasivasLog } from '../entities/ausencias-masivas-log.entity';
import { TelegramNotificationService } from '../../telegram/services/telegram-notification.service';

@Injectable()
export class AusenciasMasivasSchedulerService {
  private readonly logger = new Logger(AusenciasMasivasSchedulerService.name);

  constructor(
    private readonly ausenciasMasivasService: AusenciasMasivasService,
    @InjectRepository(AusenciasMasivasLog)
    private readonly ausenciasMasivasLogRepository: Repository<AusenciasMasivasLog>,
    private readonly telegramNotificationService: TelegramNotificationService,
  ) {}

  /**
   * Ejecuta cada minuto para verificar si hay ausencias programadas
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async verificarAusenciasProgramadas() {
    try {
      this.logger.log('🔍 Verificando ausencias programadas...');
      
      const ahora = new Date();

      // Buscar TODAS las ausencias programadas
      const ausenciasProgramadas = await this.ausenciasMasivasLogRepository
        .createQueryBuilder('log')
        .where('log.estado = :estado', { estado: 'PROGRAMADA' })
        .getMany();

      // Filtrar las que están en el minuto exacto programado
      const ausenciasParaEjecutar = ausenciasProgramadas.filter(log => {
        // Obtener la fecha actual del sistema (no de la BD)
        const ahora = new Date();
        const [horas, minutos, segundos] = log.hora_programada.split(':').map(Number);
        
        // Crear fecha programada usando la fecha actual del sistema
        const fechaProgramada = new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate(),
          horas,
          minutos,
          segundos || 0,
          0
        );
        
        // Obtener solo hora y minuto actual (ignorar segundos y milisegundos)
        const ahoraHoraMinuto = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), ahora.getHours(), ahora.getMinutes(), 0, 0);
        
        // Obtener solo hora y minuto programado (ignorar segundos y milisegundos)
        const fechaProgramadaHoraMinuto = new Date(
          fechaProgramada.getFullYear(),
          fechaProgramada.getMonth(),
          fechaProgramada.getDate(),
          fechaProgramada.getHours(),
          fechaProgramada.getMinutes(),
          0,
          0
        );
        
        this.logger.log(`🔍 [DEBUG] Ausencia ${log.id_log}:`);
        this.logger.log(`   - Fecha base: ${log.fecha_ejecucion}`);
        this.logger.log(`   - Hora programada: ${log.hora_programada}`);
        this.logger.log(`   - Fecha+Hora construida: ${fechaProgramada.toLocaleString('es-PE')}`);
        this.logger.log(`   - Fecha+Hora ISO: ${fechaProgramada.toISOString()}`);
        this.logger.log(`   - Hora+Minuto programado: ${fechaProgramadaHoraMinuto.toLocaleString('es-PE')}`);
        this.logger.log(`   - Ahora: ${ahora.toLocaleString('es-PE')}`);
        this.logger.log(`   - Hora+Minuto actual: ${ahoraHoraMinuto.toLocaleString('es-PE')}`);
        this.logger.log(`   - ¿Coinciden hora+minuto?: ${fechaProgramadaHoraMinuto.getTime() === ahoraHoraMinuto.getTime()}`);
        
        // Ejecutar si estamos en la hora y minuto programados (ignorar segundos)
        const debeEjecutar = fechaProgramadaHoraMinuto.getTime() === ahoraHoraMinuto.getTime();
        
        this.logger.log(`   - ¿Debe ejecutar?: ${debeEjecutar}`);
        
        return debeEjecutar;
      });

      if (ausenciasParaEjecutar.length === 0) {
        this.logger.log('✅ No hay ausencias programadas para ejecutar en este minuto exacto');
        return;
      }

      this.logger.log(`🚀 Ejecutando ${ausenciasParaEjecutar.length} ausencias programadas...`);

      for (const ausenciaProgramada of ausenciasParaEjecutar) {
        try {
                     // Extraer turnos del string almacenado
           const turnos = ausenciaProgramada.turnos_procesados.split(', ').map(t => t.trim());
           
           // Usar la fecha actual del sistema (no la fecha de la BD)
           const fechaActual = new Date();

           // Ejecutar la ausencia programada
           const resultado = await this.ausenciasMasivasService.ejecutarProgramaAusencias(
             fechaActual,
             ausenciaProgramada.hora_programada,
             turnos
           );

          // Actualizar estado a COMPLETADO
          await this.ausenciasMasivasLogRepository.update(
            { id_log: ausenciaProgramada.id_log },
            { 
              estado: 'COMPLETADO',
              observaciones: `Ejecutado automáticamente. ${resultado.ausenciasCreadas} ausencias creadas.`
            }
          );

          this.logger.log(`✅ Ausencia programada ejecutada: ${ausenciaProgramada.id_log}`);

        } catch (error) {
          this.logger.error(`❌ Error ejecutando ausencia programada ${ausenciaProgramada.id_log}: ${error.message}`);
          
          // Marcar como ERROR
          await this.ausenciasMasivasLogRepository.update(
            { id_log: ausenciaProgramada.id_log },
            { 
              estado: 'ERROR',
              observaciones: `Error en ejecución automática: ${error.message}`
            }
          );
        }
      }

    } catch (error) {
      this.logger.error(`❌ Error en verificación de ausencias programadas: ${error.message}`);
    }
  }

  /**
   * Programa una nueva ausencia para ejecutarse automáticamente
   */
  async programarAusencia(
    fecha: Date,
    hora: string,
    turnos: string[]
  ): Promise<string> {
    try {
      this.logger.log(`📅 Programando ausencia para ${fecha.toDateString()} a las ${hora}`);

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
      return resultado.id_log;

    } catch (error) {
      this.logger.error(`❌ Error programando ausencia: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtiene todas las ausencias programadas
   */
  async obtenerAusenciasProgramadas(): Promise<any[]> {
    try {
      const programadas = await this.ausenciasMasivasLogRepository.find({
        where: { estado: 'PROGRAMADA' },
        order: { fecha_ejecucion: 'ASC', hora_programada: 'ASC' }
      });

      return programadas.map(log => ({
        id: log.id_log,
        fecha: log.fecha_ejecucion,
        hora: log.hora_programada,
        turnos: log.turnos_procesados,
        estado: log.estado,
        fechaCreacion: log.fecha_creacion
      }));

    } catch (error) {
      this.logger.error(`❌ Error obteniendo ausencias programadas: ${error.message}`);
      throw error;
    }
  }
}
