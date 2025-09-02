import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurnoExtra } from './turno-extra.entity';
import { TurnoExtraService } from './turno-extra.service';
import { TurnoExtraController } from './turno-extra.controller';
import { TurnoExtraSchedulerService } from './turno-extra-scheduler.service';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Turno } from '../turno/turno.entity';
import { Usuario } from '../usuario/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TurnoExtra, Alumno, Turno, Usuario])
  ],
  controllers: [TurnoExtraController],
  providers: [TurnoExtraService, TurnoExtraSchedulerService],
  exports: [TurnoExtraService]
})
export class TurnoExtraModule {}
