import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity';
import { DataSource } from 'typeorm';

import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { UpdateEstadoAlumno } from '../dto/UpdateEstadoAlumno.dto';

@Injectable()
export class UpdateEstadoAlumnoUseCase {
  constructor(private readonly dataSource: DataSource) {}

  async execute(codigo: string, data: UpdateEstadoAlumno): Promise<EstadoAlumno> {
    const alumnoRepo = this.dataSource.getRepository(Alumno);
    const estadoRepo = this.dataSource.getRepository(EstadoAlumno);

    const alumno = await alumnoRepo.findOne({ where: { codigo } });
    if (!alumno) throw new NotFoundException('Alumno no encontrado');

    // Buscar el estado actual del alumno (último por fecha)
    const estadoActual = await estadoRepo.findOne({
      where: { id_alumno: alumno.id_alumno },
      order: { fecha_actualizacion: 'DESC' },
    });

    if (!estadoActual) {
      // Si no hay estado, crear uno nuevo
      const nuevoEstado = estadoRepo.create({
        estado: data.estado,
        observacion: data.observacion,
        fecha_actualizacion: new Date(),
        id_alumno: alumno.id_alumno,
      });
      return await estadoRepo.save(nuevoEstado);
    }

    // Si existe, lo actualizamos
    estadoActual.estado = data.estado;
    estadoActual.observacion = data.observacion;
    estadoActual.fecha_actualizacion = new Date();
    return await estadoRepo.save(estadoActual);
  }
}
