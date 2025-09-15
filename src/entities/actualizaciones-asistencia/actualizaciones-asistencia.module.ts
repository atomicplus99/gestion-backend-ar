import { Module } from '@nestjs/common';
import { ActualizacionAsistenciaController } from './actualizaciones-asistencia.controller';
import { CreateActualizacionAsistenciaCase } from './infraestructure/cases/CreateActualizacionAsistencia.usecase';
import { GetActualizacionesAsistenciaUseCase } from './infraestructure/cases/GetActualizacionesAsistencia.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActualizacionesAsistencia } from './infraestructure/orm/actualizaciones-asistencia.entity';
import { ActualizacionesAsistenciaRepository } from './domain/repository/actualizaciones-asistencia.repository';



@Module({
  imports: [
    TypeOrmModule.forFeature([ActualizacionesAsistencia])
  ],
  controllers: [ActualizacionAsistenciaController],
  providers: [CreateActualizacionAsistenciaCase, GetActualizacionesAsistenciaUseCase, ActualizacionesAsistenciaRepository],
  exports: [ActualizacionesAsistenciaRepository]
})
export class ActualizacionesAsistenciaModule {}
