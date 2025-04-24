import { Inject, Injectable } from '@nestjs/common';

import { Alumno } from '../../../../infraestructure/orm/entities/alumno.entity';
import { AlumnoTypeOrmRepository } from '../../../../infraestructure/adapters/outbounds/repository/alumno.repository';

@Injectable()
export class ValidarAlumnoUseCase {
  constructor(
    private readonly alumnoRepo: AlumnoTypeOrmRepository,
  ) {}

  async execute(codigoQR: string): Promise<Alumno | null> {
    return await this.alumnoRepo.findByCodigoQR(codigoQR);
  }
}
