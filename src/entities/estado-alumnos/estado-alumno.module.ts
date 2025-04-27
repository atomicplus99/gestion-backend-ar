import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EstadoAlumno } from './entities/estado-alumno.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';


import { EstadoAlumnoRepository } from './repository/update-estado-alumno.repository';
import { UpdateEstadoAlumnoUseCase } from './entities/cases/UpdateEstadoAlumno.usecases';
import { EstadoAlumnoController } from './entities/estado-alumno.controller';
import { GetAlumnosEstadoUseCase } from './entities/cases/GetAlumnosEstado.usecases';



@Module({
  imports: [TypeOrmModule.forFeature([EstadoAlumno, Alumno])],
  controllers: [EstadoAlumnoController],
  providers: [EstadoAlumnoRepository, UpdateEstadoAlumnoUseCase, GetAlumnosEstadoUseCase],
})
export class EstadoAlumnoModule {}
