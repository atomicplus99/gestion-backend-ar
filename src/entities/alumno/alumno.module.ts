import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from './infraestructure/orm/entities/alumno.entity';
import { AlumnoService } from './domain/services/alumno.service';
import { Turno } from '../turno/turno.entity';
import { Usuario } from '../usuario/usuario.entity';
import { AlumnoController } from './infraestructure/adapters/inbound/controllers/alumno.controller';
import { UniqueCodigoConstraint } from 'src/common/validations/unique-code-alumno.validator';
import { CreateAlumnoUseCase } from './domain/ports/inbound/cases/create-alumno.usecase';
import { AlumnoTypeOrmRepository } from './infraestructure/adapters/outbounds/repository/alumno.repository';
import { TurnoTypeOrmRepository } from '../turno/repository/turno.repository';
import { UsuarioTypeOrmRepository } from '../usuario/repository/usuario.repository';
import { ValidarAlumnoUseCase } from './domain/ports/inbound/cases/validate-alumno-qr.usecases';
import { GetAlumnoByCodigoUseCase } from './domain/ports/inbound/cases/get-personal-alumno.usecase';
import { ActualizarAlumnoCase } from './domain/ports/inbound/cases/update-alumno.usecase';
import { GetAlumnosUseCase } from './domain/ports/inbound/cases/get-alumnos.usecase';
import { ImportAlumnosExcelUseCase } from './domain/ports/inbound/cases/import-alumnos-excel.usecase';
import { ExcelProcessorService } from './infraestructure/services/ExcelProcessor.service';
import { ImportAlumnosExcelService } from './infraestructure/services/ImportAlumnosExcel.service';
import { ImportAlumnosExcelMapper } from './infraestructure/mappers/ImportAlumnosExcel.mapper';
import { UsuarioMapper } from './infraestructure/mappers/UsuarioMapper.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alumno, Turno, Usuario]),
  ],
  controllers: [AlumnoController],
  providers: [
    AlumnoService,
    UniqueCodigoConstraint,
    GetAlumnoByCodigoUseCase,
    CreateAlumnoUseCase,
    ValidarAlumnoUseCase,
    ActualizarAlumnoCase,
    AlumnoTypeOrmRepository, // 👈 importante registrar
    TurnoTypeOrmRepository,
    UsuarioTypeOrmRepository,
    GetAlumnosUseCase,
    ExcelProcessorService,
    ImportAlumnosExcelService,
    ImportAlumnosExcelMapper,
    UsuarioMapper
  ],
  exports: [
    GetAlumnoByCodigoUseCase,
    ActualizarAlumnoCase,
    ValidarAlumnoUseCase,     // 👈 para usarlo desde AsistenciaModule
    AlumnoTypeOrmRepository,  // 👈 para que también pueda ser inyectado desde otros módulos
    TurnoTypeOrmRepository,
    UsuarioTypeOrmRepository,
    GetAlumnosUseCase
  ]
})
export class AlumnoModule {}


