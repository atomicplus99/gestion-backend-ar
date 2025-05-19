import { Module } from '@nestjs/common';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { AlumnoModule } from '../alumno/alumno.module';
import { ValidarAlumnoUseCase } from '../alumno/domain/ports/inbound/cases/validate-alumno-qr.usecases';

import { AsistenciaTypeOrmRepository } from './domain/repository/asistencia.repository';
import { RegistrarAsistenciaDesdeQRUseCase } from './cases/registrar-asistencia.usecase';
import { GetAsistenciasUseCase } from './cases/GetAsistencia.usecase';
import { UpdateAsistenciaUseCase } from './cases/UpdateAsistencia.usecase';
import { AlumnoTypeOrmRepository } from '../alumno/infraestructure/adapters/outbounds/repository/alumno.repository';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { ActualizacionesAsistencia } from '../actualizaciones-asistencia/infraestructure/orm/actualizaciones-asistencia.entity';
import { CrearAsistenciaManualUseCase } from './cases/CreateAsistenciaManual.usecase';
import { Auxiliar } from '../auxiliar/auxiliar.entity';
import { AuxiliarModule } from '../auxiliar/auxiliar.module';
import { ActualizacionesAsistenciaRepository } from '../actualizaciones-asistencia/domain/repository/actualizaciones-asistencia.repository';
import { ActualizacionesAsistenciaModule } from '../actualizaciones-asistencia/actualizaciones-asistencia.module';



@Module({
  imports: [
    AlumnoModule,
    TypeOrmModule.forFeature([Asistencia, Alumno, ActualizacionesAsistencia, Auxiliar]),
    AuxiliarModule,
    ActualizacionesAsistenciaModule
    
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService,
      AsistenciaTypeOrmRepository,
      AlumnoTypeOrmRepository,
      RegistrarAsistenciaDesdeQRUseCase,
      CrearAsistenciaManualUseCase,
      UpdateAsistenciaUseCase,
      GetAsistenciasUseCase, 
      ValidarAlumnoUseCase,],
  exports:[AsistenciaTypeOrmRepository]
})
export class AsistenciaModule {}
