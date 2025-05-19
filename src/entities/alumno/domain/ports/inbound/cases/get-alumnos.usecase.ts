// src/application/use-cases/get-alumno-by-codigo.usecase.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { Alumno } from '../../../../infraestructure/orm/entities/alumno.entity';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';


@Injectable()
export class GetAlumnosUseCase {
  constructor(private readonly alumnoTypeOrmRepository: AlumnoTypeOrmRepository) {}

  async execute(): Promise<Alumno[]> {
     return await this.alumnoTypeOrmRepository.findAll();
  }

   
}
