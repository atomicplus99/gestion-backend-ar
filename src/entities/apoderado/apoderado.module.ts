import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apoderado as ApoderadoORM } from './infraestructure/orm/entities/apoderado.entity';
import { Alumno } from '../alumno/infraestructure/orm/entities/alumno.entity';
import { ApoderadoController } from './infraestructure/adapters/inbound/controllers/apoderado.controller';
import { ApoderadoTypeOrmRepository } from './infraestructure/adapters/outbounds/repository/apoderado.repository';
import { CreateApoderadoUseCase } from './domain/ports/inbound/cases/create-apoderado.usecase';
import { GetApoderadosUseCase } from './domain/ports/inbound/cases/get-apoderados.usecase';
import { GetApoderadoByIdUseCase } from './domain/ports/inbound/cases/get-apoderado-by-id.usecase';
import { GetApoderadoByDniUseCase } from './domain/ports/inbound/cases/get-apoderado-by-dni.usecase';
import { UpdateApoderadoUseCase } from './domain/ports/inbound/cases/update-apoderado.usecase';
import { DeleteApoderadoUseCase } from './domain/ports/inbound/cases/delete-apoderado.usecase';
import { AssignStudentsUseCase } from './domain/ports/inbound/cases/assign-students.usecase';
import { RemoveStudentsUseCase } from './domain/ports/inbound/cases/remove-students.usecase';
import { APODERADO_REPOSITORY_PORT } from './domain/ports/outbound/ApoderadoRepository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApoderadoORM, Alumno]),
  ],
  controllers: [ApoderadoController],
  providers: [
    {
      provide: APODERADO_REPOSITORY_PORT,
      useClass: ApoderadoTypeOrmRepository,
    },
    CreateApoderadoUseCase,
    GetApoderadosUseCase,
    GetApoderadoByIdUseCase,
    GetApoderadoByDniUseCase,
    UpdateApoderadoUseCase,
    DeleteApoderadoUseCase,
    AssignStudentsUseCase,
    RemoveStudentsUseCase,
    ApoderadoTypeOrmRepository,
  ],
  exports: [
    CreateApoderadoUseCase,
    GetApoderadoByIdUseCase,
    GetApoderadoByDniUseCase,
    ApoderadoTypeOrmRepository,
    {
      provide: APODERADO_REPOSITORY_PORT,
      useClass: ApoderadoTypeOrmRepository,
    },
  ],
})
export class ApoderadoModule {}
