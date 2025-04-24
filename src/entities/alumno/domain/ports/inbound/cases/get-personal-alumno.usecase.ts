// src/application/use-cases/get-alumno-by-codigo.usecase.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import { Alumno } from '../../../../infraestructure/orm/entities/alumno.entity';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';

@Injectable()
export class GetAlumnoByCodigoUseCase {
  constructor(private readonly repo: AlumnoTypeOrmRepository) {}

  async execute(codigo: string): Promise<Partial<Alumno>> {
    const alumno = await this.repo.findByCodigo(codigo);
    if (!alumno) {
      throw new NotFoundException(`Alumno con código ${codigo} no encontrado`);
    }
    return alumno;
  }
}
