import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JustificacionController } from './justificacion.controller';
import { Justificacion } from './justificacion.entity';
import { CreateJustificacionUseCase } from './use-cases/create-justificacion.usecase';
import { ListJustificacionesUseCase } from './use-cases/list-justificaciones.usecase';
import { GetJustificacionesByAlumnoUseCase } from './use-cases/get-justificaciones-by-alumno.usecase';
import { UpdateEstadoJustificacionUseCase } from './use-cases/update-estado-justificacion.usecase';
import { JustificacionRepository } from './justificacion.repository';
import { JustificacionAsistenciaService } from './services/justificacion-asistencia.service';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { Auxiliar } from '../auxiliar/auxiliar.entity';
import { Asistencia } from '../asistencia/asistencia.entity';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Justificacion, Alumno, Auxiliar, Asistencia]),
    TelegramModule,
  ],
  controllers: [JustificacionController],
  providers: [
    CreateJustificacionUseCase,
    ListJustificacionesUseCase,
    GetJustificacionesByAlumnoUseCase,
    UpdateEstadoJustificacionUseCase,
    JustificacionRepository,
    JustificacionAsistenciaService,
  ],
  exports: [
    JustificacionRepository,
    CreateJustificacionUseCase,
    ListJustificacionesUseCase,
    GetJustificacionesByAlumnoUseCase,
    UpdateEstadoJustificacionUseCase,
    JustificacionAsistenciaService,
  ],
})
export class JustificacionModule {}
