import { Module } from '@nestjs/common';
import { AsistenciaController } from './asistencia.controller';
import { AsistenciaService } from './asistencia.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asistencia } from './asistencia.entity';
import { AlumnoModule } from '../alumno/alumno.module';
import { ValidarAlumnoUseCase } from '../alumno/cases/validate-alumno-qr.usecases';
import { RegistrarAsistenciaUseCase } from './cases/registrar-asistencia.usecase';

@Module({
  imports: [
    AlumnoModule,
    TypeOrmModule.forFeature([Asistencia]),
    
  ],
  controllers: [AsistenciaController],
  providers: [AsistenciaService,
      RegistrarAsistenciaUseCase, 
      ValidarAlumnoUseCase,]
})
export class AsistenciaModule {}
