import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsistenciaExtra } from './asistencia-extra.entity';
import { AsistenciaExtraRepository } from './asistencia-extra.repository';
import { AsistenciaExtraService } from './asistencia-extra.service';
import { AsistenciaExtraController } from './asistencia-extra.controller';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AsistenciaExtra]),
    TelegramModule
  ],
  controllers: [AsistenciaExtraController],
  providers: [AsistenciaExtraService, AsistenciaExtraRepository],
  exports: [AsistenciaExtraService, AsistenciaExtraRepository]
})
export class AsistenciaExtraModule {}
