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
      
      const turnosExpirados = await this.turnoExtraService.marcarTurnosExpirados();
      
      if (turnosExpirados > 0) {
      } else {
      }
      
    } catch (error) {
    }
  }
}
