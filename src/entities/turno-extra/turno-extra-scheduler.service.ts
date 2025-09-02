import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TurnoExtraService } from './turno-extra.service';

@Injectable()
export class TurnoExtraSchedulerService {
  private readonly logger = new Logger(TurnoExtraSchedulerService.name);

  constructor(private readonly turnoExtraService: TurnoExtraService) {}

  /**
   * Ejecutar diariamente a las 00:00 para marcar turnos extra como expirados
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async marcarTurnosExpirados() {
    try {
      this.logger.log('🔄 Iniciando verificación diaria de turnos extra expirados...');
      
      const turnosExpirados = await this.turnoExtraService.marcarTurnosExpirados();
      
      if (turnosExpirados > 0) {
        this.logger.log(`✅ ${turnosExpirados} turnos extra marcados como expirados`);
      } else {
        this.logger.log('ℹ️ No hay turnos extra que marcar como expirados');
      }
      
    } catch (error) {
      this.logger.error(`❌ Error en el scheduler de turnos extra: ${error.message}`);
    }
  }
}
