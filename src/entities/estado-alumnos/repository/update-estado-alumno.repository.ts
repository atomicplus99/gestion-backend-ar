import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { EstadoAlumno } from '../entities/estado-alumno.entity';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { UpdateEstadoAlumno } from '../entities/dto/UpdateEstadoAlumno.dto';

@Injectable()
export class EstadoAlumnoRepository {
  private readonly estadoRepo: Repository<EstadoAlumno>;
  private readonly alumnoRepo: Repository<Alumno>;

  constructor(private readonly dataSource: DataSource) {
    this.estadoRepo = this.dataSource.getRepository(EstadoAlumno);
    this.alumnoRepo = this.dataSource.getRepository(Alumno);
  }

  async updateStatus(idAlumno: string, dto: UpdateEstadoAlumno): Promise<EstadoAlumno> {
    const alumno = await this.alumnoRepo.findOne({
      where: { id_alumno: idAlumno },
    });

    if (!alumno) {
      throw new NotFoundException('Alumno no encontrado');
    }

    const newStatus = this.estadoRepo.create({
      estado: dto.estado,
      observacion: dto.observacion,
      fecha_actualizacion: new Date(),
      id_alumno: alumno.id_alumno, // ✅ Usamos solo el UUID
    });

    return this.estadoRepo.save(newStatus);
  }

  async findLatestStatus(idAlumno: string): Promise<EstadoAlumno | null> {
    return this.estadoRepo.findOne({
      where: { id_alumno: idAlumno },
      order: { fecha_actualizacion: 'DESC' },
    });
  }
}
