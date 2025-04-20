import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from './alumno.entity';
import { AlumnoService } from './alumno.service';
import { Turno } from '../turno/turno.entity';
import { Usuario } from '../usuario/usuario.entity';
import { AlumnoController } from './alumno.controller';
import { UniqueCodigoConstraint } from 'src/common/validations/unique-code-alumno.validator';
import { CreateAlumnoUseCase } from './cases/create-alumno.usecase';
import { AlumnoTypeOrmRepository } from './repository/alumno.repository';
import { TurnoTypeOrmRepository } from '../turno/repository/turno.repository';
import { UsuarioTypeOrmRepository } from '../usuario/repository/usuario.repository';
import { ValidarAlumnoUseCase } from './cases/validate-alumno-qr.usecases';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alumno, Turno, Usuario]),
  ],
  controllers: [AlumnoController],
  providers: [
    AlumnoService,
    UniqueCodigoConstraint,
    CreateAlumnoUseCase,
    ValidarAlumnoUseCase,
    AlumnoTypeOrmRepository, // 👈 importante registrar
    TurnoTypeOrmRepository,
    UsuarioTypeOrmRepository,
  ],
  exports: [
    ValidarAlumnoUseCase,     // 👈 para usarlo desde AsistenciaModule
    AlumnoTypeOrmRepository,  // 👈 para que también pueda ser inyectado desde otros módulos
    TurnoTypeOrmRepository,
    UsuarioTypeOrmRepository,
  ]
})
export class AlumnoModule {}


