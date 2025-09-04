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
import { VerificarAsistenciaUseCase } from './cases/verificar-asistencia.usecase';
import { CrearAusenciaAlumnoUseCase } from './cases/crear-ausencia-alumno.usecase';
import { ActualizarAsistenciaPorCodigoUseCase } from './cases/actualizar-asistencia-por-codigo.usecase';
import { AnularAsistenciaUseCase } from './cases/anular-asistencia.usecase';
import { Auxiliar } from '../auxiliar/auxiliar.entity';
import { AuxiliarModule } from '../auxiliar/auxiliar.module';
import { ActualizacionesAsistenciaRepository } from '../actualizaciones-asistencia/domain/repository/actualizaciones-asistencia.repository';
import { ActualizacionesAsistenciaModule } from '../actualizaciones-asistencia/actualizaciones-asistencia.module';
import { AusenciasMasivasService } from './services/ausencias-masivas.service';
import { AusenciasMasivasController } from './ausencias-masivas.controller';
import { AusenciasMasivasSchedulerService } from './services/ausencias-masivas-scheduler.service';
import { TelegramModule } from '../telegram/telegram.module';
import { AusenciasMasivasLog } from './entities/ausencias-masivas-log.entity';
import { AusenciasMasivasProgramadas } from './entities/ausencias-masivas-programadas.entity';
import { Usuario } from '../usuario/usuario.entity';
import { Administrador } from '../administrador/administrador.entity';
import { Director } from '../director/director.entity';
import { NotificacionModule } from '../notificacion/notificacion.module';
import { TurnoExtraModule } from '../turno-extra/turno-extra.module';
import { AsistenciaExtraModule } from '../asistencia-extra/asistencia-extra.module';
import { AdministradorModule } from '../administrador/administrador.module';
import { DirectorModule } from '../director/director.module';



@Module({
  imports: [
    AlumnoModule,
    TypeOrmModule.forFeature([Asistencia, Alumno, ActualizacionesAsistencia, Auxiliar, AusenciasMasivasLog, AusenciasMasivasProgramadas, Usuario, Administrador, Director]),
    AuxiliarModule,
    ActualizacionesAsistenciaModule,
    TelegramModule,
    NotificacionModule,
    TurnoExtraModule,
    AsistenciaExtraModule,
    AdministradorModule,
    DirectorModule
  ],
  controllers: [AsistenciaController, AusenciasMasivasController],
  providers: [AsistenciaService,
      AsistenciaTypeOrmRepository,
      AlumnoTypeOrmRepository,
      RegistrarAsistenciaDesdeQRUseCase,
      CrearAsistenciaManualUseCase,
      CrearAusenciaAlumnoUseCase,
      ActualizarAsistenciaPorCodigoUseCase,
      AnularAsistenciaUseCase,
      UpdateAsistenciaUseCase,
      GetAsistenciasUseCase, 
      ValidarAlumnoUseCase,
      VerificarAsistenciaUseCase,
      AusenciasMasivasService,
      AusenciasMasivasSchedulerService],
  exports:[AsistenciaTypeOrmRepository]
})
export class AsistenciaModule {}
