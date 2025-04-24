import { Module } from '@nestjs/common';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { AlumnoModule } from '../alumno/alumno.module';
import { ValidarAlumnoUseCase } from '../alumno/domain/ports/inbound/cases/validate-alumno-qr.usecases';

import { AsistenciaTypeOrmRepository } from './domain/repository/asistencia.repository';
import { RegistrarAsistenciaDesdeQRUseCase } from './cases/registrar-asistencia.usecase';


@Module({
  imports: [
    AlumnoModule,
    TypeOrmModule.forFeature([Asistencia]),
    
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService,
      AsistenciaTypeOrmRepository,
      RegistrarAsistenciaDesdeQRUseCase, 
      ValidarAlumnoUseCase,]
})
export class AsistenciaModule {}
