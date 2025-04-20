import { Inject, Injectable } from '@nestjs/common';

import { Alumno } from '../alumno.entity';
import { AlumnoTypeOrmRepository } from '../repository/alumno.repository';

@Injectable()
export class ValidarAlumnoUseCase {
  constructor(
    private readonly alumnoRepo: AlumnoTypeOrmRepository,
  ) {}

  async execute(codigoQR: string): Promise<Alumno | null> {
    return await this.alumnoRepo.findByCodigoQR(codigoQR);
  }
}
