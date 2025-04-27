import { Injectable } from '@nestjs/common';
import { Alumno } from 'src/entities/alumno/infraestructure/orm/entities/alumno.entity';
import { EstadoAlumno } from 'src/entities/estado-alumnos/entities/estado-alumno.entity'; // ✅ entidad real
import { DataSource } from 'typeorm';

@Injectable()
export class EstadoAlumnoSeeder {
  constructor(private readonly dataSource: DataSource) {}

  async run() {
    const estadoRepo = this.dataSource.getRepository(EstadoAlumno);
    const alumnoRepo = this.dataSource.getRepository(Alumno);

    const alumnos = await alumnoRepo.find();
    const count = await estadoRepo.count();

    if (count > 0) {
      console.warn('Ya existen registros en ESTADO_ALUMNO, no se insertarán nuevos.');
      return;
    }

    const estados: EstadoAlumno[] = alumnos.map((alumno) =>
      estadoRepo.create({
        estado: 'activo',
        observacion: 'Registro inicial automático',
        fecha_actualizacion: new Date(),
        id_alumno: alumno.id_alumno, // ✅ usamos solo el ID
      })
    );

    await estadoRepo.save(estados);
    console.log('Estados \"activo\" insertados correctamente para todos los alumnos ✅');
  }
}
