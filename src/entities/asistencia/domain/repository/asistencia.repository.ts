import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asistencia } from '../../asistencia.entity';

@Injectable()
export class AsistenciaTypeOrmRepository {
  constructor(
    @InjectRepository(Asistencia)
    private readonly repo: Repository<Asistencia>,
  ) {}

  /* ---------- CRUD existentes ---------- */

  save(asistencia: Asistencia): Promise<Asistencia> {
    return this.repo.save(asistencia);
  }

  create(data: Partial<Asistencia>): Asistencia {
    return this.repo.create(data);
  }

  async findByAlumnoAndDate(
    id_alumno: string,
    fecha: Date,
  ): Promise<Asistencia | null> {
    return this.repo.findOne({
      where: {
        alumno: { id_alumno },
        fecha,
      },
      relations: ['alumno'],
    });
  }

  async existeAsistenciaDelDia(
    idAlumno: string,
    fecha: Date,
  ): Promise<boolean> {
    const asistencia = await this.repo.findOne({
      where: {
        alumno: { id_alumno: idAlumno },
        fecha,
      },
    });
    return !!asistencia;
  }

  /* ---------- NUEVO: lista de asistencias ---------- */

  /**
   * Devuelve todas las asistencias ordenadas por fecha DESC
   * e incluye las relaciones necesarias (`alumno` y su `turno`)
   * para el DTO de listado.
   */
  async findAllWithAlumnoYTurno(): Promise<Asistencia[]> {
    return this.repo.find({
      relations: {
        alumno: { turno: true },
      },
      order: { fecha: 'DESC' },
    });
  }
}
