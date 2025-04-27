// src/entities/estado-alumnos/application/cases/GetAlumnosEstado.usecase.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { AlumnoEstadoResponseDto } from '../dto/AlumnoEstadoResponse.dto';
import { AlumnoEstadoMapper } from '../../mappers/AlumnoEstadoMapper.mapper';

@Injectable()
export class GetAlumnosEstadoUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(): Promise<AlumnoEstadoResponseDto[]> {
    const alumnoRepo = this.dataSource.getRepository(Alumno);
    const estadoRepo = this.dataSource.getRepository(EstadoAlumno);

    const alumnos = await alumnoRepo.find({
      relations: ['turno', 'usuario'],
    });

    const estadosConAlumno = await Promise.all(
      alumnos.map(async (alumno) => {
        const ultimoEstado = await estadoRepo.findOne({
          where: { id_alumno: alumno.id_alumno },
          order: { fecha_actualizacion: 'DESC' },
        });

        return AlumnoEstadoMapper.toDto(alumno, ultimoEstado!);
      })
    );

    return estadosConAlumno;
  }
}
