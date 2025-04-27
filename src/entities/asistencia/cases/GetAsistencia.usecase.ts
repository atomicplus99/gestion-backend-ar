

import { Injectable } from '@nestjs/common';
import { AsistenciaTypeOrmRepository } from '../domain/repository/asistencia.repository';
import { AsistenciaModel } from '../domain/entities/Asistencia';
import { Asistencia } from '../asistencia.entity'

@Injectable()
export class GetAsistenciasUseCase {
  constructor(
    private readonly asistenciaRepo: AsistenciaTypeOrmRepository,
  ) {}

  /**
   * Obtiene todas las asistencias, incluyendo la relación
   * `alumno` y el `turno` del alumno, ordenadas por fecha DESC.
   */
  async execute(): Promise<Asistencia[]> {
    return this.asistenciaRepo.findAllWithAlumnoYTurno();
  }
}
